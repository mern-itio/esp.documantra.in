const { serviceGet, servicePost } = require("../utils/apiHelper");

// controllers/MainController.js
const getNotifications = async (req, res) => {
  const orgId = req.headers['x-organization-id'];
  const limit = Number(req.query.limit) || 20;

  try {
    const requests = [
      serviceGet(req, 'esign', {
        url: `/api/e-sign/notifications?limit=${limit}`
      }),

      serviceGet(req, 'auth', {
        url: `/api/user/notifications?limit=${limit}`
      })
    ];

    // Fetch organization notifications only if org header exists
    if (orgId) {
      requests.push(
        serviceGet(req, 'organization', {
          url: `/api/organization/notifications?limit=${limit}`,
          headers: { 'x-organization-id': orgId }
        })
      );
    }

    const results = await Promise.allSettled(requests);

    const allNotifications = [];
    let unreadCount = 0;

    // ---- ESIGN ----
    if (results[0].status === 'fulfilled') {
      const esignData = results[0].value.data.data;
      unreadCount += esignData.unreadCount || 0;

      esignData.notifications.forEach(n => {
        allNotifications.push({
          id: n._id,
          source: n?.source || 'ESIGN',
          type: n.type,
          title: n.envelopeSubject,
          message: n.message,
          isRead: n.isRead,
          createdAt: n.createdAt,
          metadata: {
            envelopeId: n.envelopeId,
            recipientId: n.recipientId
          }
        });
      });
    }

    // ---- USER ----
    if (results[1].status === 'fulfilled') {
      const userData = results[1].value.data.data;

      userData.notifications.forEach(n => {
        if (!n.isRead) unreadCount++;

        allNotifications.push({
          id: n._id,
          source: n?.source || 'USER',
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          createdAt: n.createdAt,
          metadata: n.metadata
        });
      });
    }

    // ---- ORGANIZATION (conditional index) ----
    if (orgId && results[2]?.status === 'fulfilled') {
      const orgData = results[2].value.data.data;

      orgData.notifications.forEach(n => {
        allNotifications.push({
          id: n._id,
          source: n?.source || 'ORG',
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: false, // org notifications are usually broadcast
          createdAt: n.createdAt,
          metadata: n.metadata
        });
      });
    }

    // ---- SORT DESC ----
    allNotifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({
      status: 'success',
      data: {
        notifications: allNotifications.slice(0, limit),
        unreadCount
      }
    });

  } catch (error) {
    console.error('Gateway notification error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications'
    });
  }
};

const markReadById = async(req, res) =>{
  const {source} = req.body;
  const { id } = req.params;
  switch (source) {
    case 'USER':
        try{
          const response = servicePost(req, 'auth',{
            url:`/api/notifications/${id}/read`
          });
          if (!response?.data?.success) {
              return res.status(400).json({
                success: false,
                message: response?.data?.message || 'Failed to mark notification as read'
              });
            }
            return res.status(200).json({success: true, message:'Notification marked as read successfully.'});
          }catch (err){
            console.log(err);
            return res.status('500').json({success:false, message:'Internal Server Error'});
          }

    case 'ESIGN':
        try{
          const response = servicePost(req, 'esign',{
            url:`/api/e-sign/notifications/${id}/read`
          });
            if (!response?.data?.success) {
              return res.status(400).json({
                success: false,
                message: response?.data?.message || 'Failed to mark notification as read'
              });
            }
            return res.status(200).json({success: true, message:'Notification marked as read successfully.'});
          }catch (err){
            console.log(err);
            return res.status('500').json({success:false, message:'Internal Server Error'});
          }

    default:
      break;
  }
}
const markReadAll = async (req, res) => {
  try {
    const [esignResponse, authResponse] = await Promise.all([
      servicePost(req, 'esign', {
        url: '/api/e-sign/notifications/read-all'
      }),
      servicePost(req, 'auth', {
        url: '/api/notifications/mark-all-read'
      })
    ]);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      data: {
        esign: esignResponse?.data,
        auth: authResponse?.data
      }
    });

  } catch (err) {
    console.error('markReadAll error:', err?.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read.'
    });
  }
};

// Correct export
module.exports = { getNotifications,markReadById,markReadAll };
