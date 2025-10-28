
const { serviceGet, servicePatch } = require('../utils/apiHelper');
const userList = async (req, res) => {
  try {
    const result = await serviceGet(req, 'auth', { url: '/api-admin/user-list' });
    if (!result.ok) {
      return res.status(result.status).json({ status: result.status, message: result.message, data: null });
    }
    return res.status(200).json({
      status: 200,
      message: 'User list fetched successfully from auth-service',
      data: result.data?.data ?? result.data
    });
  } catch (error) {
    console.error('Error fetching user list from auth-service:', error.message || error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

const userStatusToggle = async (req, res) =>{
  const {id} = req.params;
  const {status} = req.body;
  try{
    const result = await servicePatch(req, 'auth', {
      url: `/api-admin/user-status/toggle/${id}`,
      data: { status }
    });
    if(result.status == 200){
      return res.status(200).json({
        status:200,
        message:'User status updated successfully',
        data: result.data.data
      })
    }else{
      return res.status(404).json({
        status: 404,
        message:'User not found.'
      })
    }

  }catch (err){
    console.log('Error toggle user from auth service');
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
}

const getUserDetail = async ( req, res) =>{
  const {id} = req.params;
  try{
    const result = await serviceGet(req,'auth',{url: `/api-admin/user-detail/${id}`});
    if(result.status==200){
      return res.status(200).json({
        status:200,
        message:'User details fetched successfully',
        data:result.data.data
      });
    }
  }catch (err){
    console.log(err);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
}

const updateUserDetail = async (req, res) => {
  const {id} = req.params;
  const {fullname, email, phone, status} = req.body;
  if(!id) {
      return res.status(400).json({ status: 400, message: 'User ID is required', data: null });
  }

    // Prepare update object dynamically
    const updateFields = {};
    if (fullname !== undefined) updateFields.fullname = fullname;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (status !== undefined) updateFields.status = status;
  try{
    const result = await servicePatch(req, 'auth',{
      url:`/api-admin/user/update/${id}`,
      data: {data:updateFields}
    })
    if(result.status == 200){
      return res.status(200).json({
        status:200,
        message:'User updated successfully',
        data: result.data.data
      });
    }

  }catch (err){
    console.log(err);
    return res.status(500).json({ status:500, message: 'Internal Server Error', data:null});
  }
}

const updateUserPassword = async (req, res) => {
const {id} = req.params;
const {password} = req.body;
  if(!id) {
      return res.status(400).json({ status: 400, message: 'User ID is required', data: null });
  }
try{
  const result = await servicePatch(req, 'auth',{
    url:`/api-admin/user/password/${id}`,
    data: {password:password}
  });
  if(result.status==200){
    return res.status(200).json({
      status:200,
      message:'User updated successfully',
      data: result.data.data
    });
  }
}catch{
  console.log(err);
  return res.status(500).json({ status:500, message: 'Internal Server Error', data:null});
}
}
module.exports = { userList,userStatusToggle,getUserDetail,updateUserDetail,updateUserPassword,

};

