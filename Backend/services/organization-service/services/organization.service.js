const Organization = require('../models/organization');
const organizationUser = require('../models/organizationUser');
const organizationRole = require('../models/organizationRole');
const organizationPermission = require('../models/organizationPermission');
const orgFolder = require('../models/orgFolder');
const OrganizationNotification = require('../models/OrganizationNotification');
const OrganizationNotificationRead = require('../models/OrganizationNotificationRead');
const OrgFolderShare = require('../models/orgFolderShare');
const folderEnvelope = require('../models/folderEnvelope');

const mongoose = require('mongoose');
const axios = require('axios');
const { validateLogoUrl } = require('../utils/logoUrl');

const resolveLogoInput = (payload) => {
    const logo = payload?.logo;
    const logoUrl = payload?.logoUrl;
    if (logo != null && logo !== '' && logoUrl != null && logoUrl !== '' && String(logo).trim() !== String(logoUrl).trim()) {
        throw new Error('Conflicting logo fields');
    }
    const raw = logo ?? logoUrl;
    return raw != null && String(raw).trim() !== '' ? String(raw).trim() : undefined;
};

const createOrganization = async (payload, userId) => {
    const { name, website, gst } = payload;
    const logoInput = resolveLogoInput(payload);

    if (!name?.trim()) {
        throw new Error('Organization name is required');
    }

    const normalizedLogo = logoInput ? await validateLogoUrl(logoInput) : undefined;

    const normalizedWebsite = website
        ? String(website).trim().toLowerCase()
        : undefined;

    const normalizedGst = gst
        ? String(gst).trim().toUpperCase()
        : undefined;

    // Build dynamic duplicate check
    const orConditions = [];
    if (normalizedWebsite) orConditions.push({ website: normalizedWebsite });
    if (normalizedGst) orConditions.push({ gst: normalizedGst });

    if (orConditions.length) {
        const existing = await Organization.findOne({ $or: orConditions }).lean();

        if (existing) {
            if (
                normalizedWebsite &&
                existing.website?.toLowerCase() === normalizedWebsite
            ) {
                throw new Error('Website already in use');
            }

            if (
                normalizedGst &&
                existing.gst?.toUpperCase() === normalizedGst
            ) {
                throw new Error('GST number already in use');
            }

            throw new Error('Organization already exists');
        }
    }

    const org = await Organization.create({
        name: name.trim(),
        logo: normalizedLogo,
        website: normalizedWebsite,
        gst: normalizedGst,
        createdBy: userId,
        status: true,
        remark: "",
    });

    return org;
};
const getOrganizationDetails = async (orgId) => {  
    const result = await Organization.findById(orgId);
    if (!result) {
        res.status(404).send('Organization not found');
        return;
    }
    return result;
}
const updateOrganizationDetails = async (orgId,payload) => {
    const { name, website, gst } = payload;
    const logoInput = resolveLogoInput(payload);

    let normalizedLogo;
    if (payload.logo !== undefined || payload.logoUrl !== undefined) {
        normalizedLogo = logoInput ? await validateLogoUrl(logoInput) : undefined;
    }

    // Normalize website and GST for duplicate checking
    const normalizedWebsite = website
        ? String(website).trim().toLowerCase()
        : undefined;

    const normalizedGst = gst
        ? String(gst).trim().toUpperCase()
        : undefined;

    // Build dynamic duplicate check (excluding current organization)
    const orConditions = [];
    if (normalizedWebsite) orConditions.push({ website: normalizedWebsite });
    if (normalizedGst) orConditions.push({ gst: normalizedGst });

    if (orConditions.length) {
        const existing = await Organization.findOne({
            $or: orConditions,
            _id: { $ne: orgId } // Exclude current organization being updated
        }).lean();

        if (existing) {
            if (
                normalizedWebsite &&
                existing.website?.toLowerCase() === normalizedWebsite
            ) {
                throw new Error('Website already in use');
            }

            if (
                normalizedGst &&
                existing.gst?.toUpperCase() === normalizedGst
            ) {
                throw new Error('GST number already in use');
            }

            throw new Error('Organization details conflict with existing organization');
        }
    }

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name;
    if (logo !== undefined) updatePayload.logo = normalizedLogo;
    if (website !== undefined) updatePayload.website = normalizedWebsite;
    if (gst !== undefined) updatePayload.gst = normalizedGst;

    if (payload.status !== undefined) updatePayload.status = payload.status;
    if (payload.remark !== undefined) updatePayload.remark = payload.remark;
    if (payload.isVerified !== undefined) updatePayload.isVerified = payload.isVerified;
    if (payload.isverifcationRequested !== undefined) {
        updatePayload.isverifcationRequested = payload.isverifcationRequested;
    }
    if (payload.verificationStatus !== undefined) {
        updatePayload.verificationStatus = payload.verificationStatus;
    }
    if (payload.$push) updatePayload.$push = payload.$push;
    if (website !== undefined || gst !== undefined) {
        updatePayload.isVerified = false;
        updatePayload.verificationStatus = 'PENDING';
        updatePayload.remark = '';
    }

    const result = await Organization.findByIdAndUpdate(orgId, updatePayload, { new: true });
    if (!result) {
        throw new Error('Organization not found');
    }
    return result;
}
const deleteOrganization = async (orgId) => {
    const result = await Organization.findByIdAndDelete(orgId);
    if (!result) {
        throw new Error('Organization not found');
    }
    return true;
}
// Fetch organizations where user is owner or member
const getOrganizationsByUserId = async (userId) => {
  const objectId = new mongoose.Types.ObjectId(userId);

  const organizations = await Organization.aggregate([
    // 1. Organizations user OWNS
    {
      $match: { createdBy: objectId }
    },
    {
      $addFields: { isOwner: true }
    },

    // 2. Organizations user is MEMBER of
    {
      $unionWith: {
        coll: "organizationusers",
        pipeline: [
          { 
            $match: { 
              userId: objectId,
              status: "ACTIVE"
            } 
          },
          {
            $lookup: {
              from: "organizations",
              localField: "organizationId",
              foreignField: "_id",
              as: "org"
            }
          },
          { $unwind: "$org" },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  "$org",
                  { isOwner: false }
                ]
              }
            }
          }
        ]
      }
    }
  ]);

  return organizations;
};
const getAllOrganizations = async () => {
    const organizations = await Organization.find();
    return organizations;
}
const getAllOrganizationsRquest = async () => {
    const organizations = await Organization.find({ isverifcationRequested: true });
    return organizations;
}
const getOrganizationUser = async (orgId, userId) => {
      const orgUser = await organizationUser.findOne({
            organizationId: orgId,
            userId: userId,
            status: "ACTIVE"
        }).lean();

        return orgUser;
}
const getOrganizationRoleById = async (roleId) => {
    const orgRole = await organizationRole.findById(roleId).lean();
    return orgRole;
}
const getOrganizationPermissionsByRoleId = async (roleId) => {
    const orgPermissions = await organizationPermission.findOne({ roleId }).lean();
    return orgPermissions;
}
const createFolderInOrganization = async (orgId, folderData,userId) => {
    const existingOrg = await orgFolder.findOne({organizationId:orgId, name: folderData.name});
    if (existingOrg) {
        throw new Error('Folder with the same name already exists in the organization');
    }
    const newFolder = await orgFolder.create({  
        organizationId: orgId,
        name: folderData.name,
        color: folderData.color,
        icon: folderData.icon,
        createdBy: userId
    });
    return newFolder;
};
const getFoldersInOrganization = async (orgId, userId) => {
  const mongoose = require('mongoose');

  orgId = new mongoose.Types.ObjectId(orgId);
  userId = new mongoose.Types.ObjectId(userId);

  /* --------------------------------------------------
     1. Fetch org membership (OPTIONAL, not mandatory)
  -------------------------------------------------- */
  const orgUser = await organizationUser
    .findOne({
      organizationId: orgId,
      userId,
      status: 'ACTIVE'
    })
    .select('_id roleId')
    .lean();

  // These may be null — and that's OK
  const orgUserId = orgUser?._id || null;
  const userRoleId = orgUser?.roleId || null;

  /* --------------------------------------------------
     2. Folder aggregation
  -------------------------------------------------- */
  const folders = await orgFolder.aggregate([
    /* ---------- Only folders in org ---------- */
    {
      $match: { organizationId: orgId }
    },

    /* ---------- Folder shares ---------- */
    {
      $lookup: {
        from: 'orgfoldershares',
        localField: '_id',
        foreignField: 'folderId',
        as: 'shares'
      }
    },

    /* ---------- Folder envelopes ---------- */
    {
      $lookup: {
        from: 'folderenvelopes',
        localField: '_id',
        foreignField: 'folderId',
        as: 'envelopes'
      }
    },

    /* ---------- Ownership ---------- */
    {
      $addFields: {
        isOwner: { $eq: ['$createdBy', userId] }
      }
    },

    /* ---------- Resolve permissions (OWNER > USER > ROLE) ---------- */
    {
      $addFields: {
        permissions: {
          $cond: [
            '$isOwner',
            { view: true, edit: true, share: true },
            {
              $let: {
                vars: {
                  userShare: {
                    $first: {
                      $filter: {
                        input: '$shares',
                        as: 's',
                        cond: {
                          $and: [
                            { $eq: ['$$s.sharedWithType', 'USER'] },
                            orgUserId
                              ? { $eq: ['$$s.sharedWithId', orgUserId] }
                              : false
                          ]
                        }
                      }
                    }
                  },
                  roleShare: {
                    $first: {
                      $filter: {
                        input: '$shares',
                        as: 's',
                        cond: {
                          $and: [
                            { $eq: ['$$s.sharedWithType', 'ROLE'] },
                            userRoleId
                              ? { $eq: ['$$s.sharedWithId', userRoleId] }
                              : false
                          ]
                        }
                      }
                    }
                  }
                },
                in: {
                  $ifNull: ['$$userShare.permission', '$$roleShare.permission']
                }
              }
            }
          ]
        }
      }
    },

    /* ---------- Access filter ---------- */
    {
      $match: {
        $or: [
          { isOwner: true },
          { permissions: { $ne: null } }
        ]
      }
    },

    /* ---------- Collect ALL shared users & roles ---------- */
    {
      $addFields: {
        sharedPeople: {
          $map: {
            input: {
              $filter: {
                input: '$shares',
                as: 's',
                cond: { $eq: ['$$s.sharedWithType', 'USER'] }
              }
            },
            as: 'sp',
            in: '$$sp.sharedWithId'
          }
        },
        sharedRoles: {
          $map: {
            input: {
              $filter: {
                input: '$shares',
                as: 's',
                cond: { $eq: ['$$s.sharedWithType', 'ROLE'] }
              }
            },
            as: 'sr',
            in: '$$sr.sharedWithId'
          }
        }
      }
    },

    /* ---------- Final shape ---------- */
    {
      $project: {
        _id: 1,
        organizationId: 1,
        folderName: '$name',
        color: 1,
        icon: 1,
        isOwner: 1,
        permissions: 1,
        sharedPeople: 1,
        sharedRoles: 1,
        envelopes: {
          $map: {
            input: '$envelopes',
            as: 'e',
            in: '$$e.envelopeId'
          }
        },
        createdAt: 1
      }
    }
  ]);

  return folders;
};
const getOrganizationMembers = async (orgId) => {
  const members = await organizationUser.find({
    organizationId: orgId, // orgId
  })
  .populate({
    path: 'roleId',
    select: 'name description' // only what you need
  })
  .select('_id userId email name status roleId createdAt, addedBy');

  return members;

}
const createOrganizationRole = async (orgId, roleData) => {
    const existingRole = await organizationRole.findOne({organizationId:orgId, name: roleData.name});
    if (existingRole) {
        throw new Error('Role with the same name already exists in the organization');
    }
    const newRole = await organizationRole.create({  
        organizationId: orgId,
        name: roleData.name,
        description: roleData?.description || ""
    });
    return newRole;
};
const getOrganizationRoles = async (orgId) => {
  const roles = await organizationRole.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(orgId)
        }
      },
      {
        $lookup: {
          from: "organizationpermissions", // Mongo collection name (lowercase + plural)
          localField: "_id",
          foreignField: "roleId",
          as: "permissions"
        }
      },
      {
        $unwind: {
          path: "$permissions",
          preserveNullAndEmptyArrays: true // role without permissions still returned
        }
      }
    ]);

    return roles;
};
const updateOrganizationRole = async (roleId, roleData) => {
    const existingRole = await organizationRole.findOne({ _id: { $ne: roleId }, organizationId: roleData.organizationId, name: roleData.name });
    if (existingRole) {
        throw new Error('Role with the same name already exists in the organization');
    }
    const updatedRole = await organizationRole.findByIdAndUpdate(roleId, {
        name: roleData.name,
        description: roleData?.description || ""
    }, { new: true });
    if (!updatedRole) {
        throw new Error('Role not found');
    }
    return updatedRole;
}
const updateRolePermissions = async (roleId, permissions) => {
    let orgPermissions = await organizationPermission.findOne({ roleId });
    if (!orgPermissions) {
        orgPermissions = await organizationPermission.create({
            roleId,
            permissions: permissions
        });
    } else {
        orgPermissions.permissions = permissions;
        await orgPermissions.save();
    }
    return orgPermissions;
};
const getOrgNotifications = async (organizationId, userId,role) => {
    const notifications = await OrganizationNotification.find({
    organizationId,
    $or: [
      { targetUserIds: { $size: 0 } },
      { targetUserIds: userId },
      { targetRoles: role }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(20)
  .lean();
    return notifications;
}
const getNotificcatoinReadIds = async(userId,notifications )=>{
  const result = await OrganizationNotificationRead.find({
    userId,
    notificationId: { $in: notifications.map(n => n._id) }
  }).distinct('notificationId');
  return result
}
const addMemberToOrganization = async (orgId, payload,addedBy) => {
  const result = await organizationUser.create({
    organizationId: orgId,
    ...payload,     // ✅ spreads fields correctly
    addedBy
  });

  return result;
}
const getUserInvitationById = async (invitationId,userId) => {
    const invitation = await organizationUser.findOne({_id:invitationId, userId:userId})
    .populate({
      path: 'organizationId',
      select: 'name logo website gst'
    })
    .populate({
      path: 'roleId',
      select: 'name description'
    })
    .lean();
    if (!invitation) return null;

    let invitedBy = null;
    if (invitation.addedBy) {
      const orgRef = invitation.organizationId;
      const orgId = orgRef && typeof orgRef === 'object' && orgRef._id
        ? orgRef._id
        : orgRef;

      // Prefer org roster row (covers admins/members who have an OrganizationUser doc)
      const inviterMember = await organizationUser.findOne({
        organizationId: orgId,
        userId: invitation.addedBy
      }).select('name email').lean();

      if (inviterMember && (inviterMember.name || inviterMember.email)) {
        invitedBy = {
          name: inviterMember.name || null,
          email: inviterMember.email || null
        };
      } else {
        /*
         * Owners often have no OrganizationUser row (they are tied via Organization.createdBy only),
         * so the lookup above misses them. Resolve name/email from auth User.
         */
        const authUrl = process.env.AUTH_SERVICE_URL;
        if (authUrl) {
          try {
            const addedByStr = invitation.addedBy.toString
              ? invitation.addedBy.toString()
              : String(invitation.addedBy);
            const { data: authRes } = await axios.get(
              `${authUrl.replace(/\/$/, '')}/api/user-details/${addedByStr}`,
              { timeout: 8000 }
            );
            const u = authRes?.data;
            if (u) {
              invitedBy = {
                name: u.fullname || u.name || null,
                email: u.email || null
              };
            }
          } catch (_) {
            /* ignore — UI will show fallback if still null */
          }
        }
      }
    }

    return { ...invitation, invitedBy };
};
const acceptOrganizationInvitation = async (invitationId,userId) => {
    const invitation = await organizationUser.findOne({_id:invitationId,userId:userId});
    if (!invitation) {
        throw new Error('Invitation not found');
    }
    invitation.status = 'ACTIVE';
    await invitation.save();
    return invitation;
}
const rejectOrganizationInvitation = async (invitationId,userId) => {
    const invitation = await organizationUser.findOne({_id:invitationId,userId:userId});
    if (!invitation) {
        throw new Error('Invitation not found');
    }
    invitation.status = 'REJECTED';
    await invitation.save();
    return invitation;
}
const shareFolder = async (payload) => {
  const result =  await OrgFolderShare.create(payload);
  return result;
};
const fetchFolderById = async (folderId) => {
    const folder = await orgFolder.findById(folderId).lean();
    if (!folder) {
        throw new Error('Folder not found');
    }
    return folder;
}
const fetchFolderEnvelopeIds = async (folderId) => {
    const envelopes = await folderEnvelope.find({ folderId }).select('envelopeId -_id').lean();
    return envelopes.map(e => e.envelopeId);
}
const getRolesandUsersByFolderId = async (folderId) =>{
  const shares = await OrgFolderShare.find({ folderId }).lean();
  const userIds = shares
    .filter(s => s.sharedWithType === 'USER')
    .map(s => s.sharedWithId);

  const roleIds = shares
    .filter(s => s.sharedWithType === 'ROLE')
    .map(s => s.sharedWithId);
  const users = await organizationUser.find({ _id: { $in: userIds } })
  .select('name email roleId')
  .populate('roleId', 'name')
  .lean();

  const roles = await organizationRole.find({ _id: { $in: roleIds } })
    .select('name description')
    .lean();
  const formattedUsers = users.map(u => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.roleId?.name || null
  }));

  const formattedRoles = roles.map(r => ({
    _id: r._id,
    name: r.name,
    description: r.description
  }));

  const result = {
    users: formattedUsers,
    roles: formattedRoles
  };
  return result;

}
const checkExistingEnvelope = async(folderId,envelopeIds) =>{
  const docs = await folderEnvelope
      .find(
        { folderId, envelopeId: { $in: envelopeIds } },
        { envelopeId: 1, _id: 0 }
      )
      .lean();

  return docs.map(d => d.envelopeId);
}
const insertEnvelopesToFolder = async(folderId, envelopeIds, userId) =>{
  const records = envelopeIds.map(envelopeId => ({
    folderId: folderId,
    envelopeId: envelopeId,
    addedBy: userId
  }));

  try{
    const result = await folderEnvelope.insertMany(records,{ordered:false});
    return{
      insertedCount: result.length
    }
  }catch (err){
    console.log(err);
    if (err.code === 11000) {
      return {
        insertedCount: err.result?.nInserted || 0
      };
    }
    throw err;
  }

}
const updateOrganizationVerficationStatus = async (orgId, status, remark) => {
  let isVerified = false;
  if(status === 'APPROVED'){
    isVerified = true;
   } else if(status === 'REJECTED'){
    isVerified = false;
   }  else{
    throw new Error('Invalid status value');
   }

    const payload = {
        verificationStatus: status,
        remark: remark,
        isVerified: isVerified
    };
    const result = await Organization.findByIdAndUpdate(orgId, payload, { new: true });
    return result;
};
const removeEnvelopeFromFolder = async (folderId, envelopeId) => {
    const objFolderId = new mongoose.Types.ObjectId(folderId);
    const objEnvelopeId = new mongoose.Types.ObjectId(envelopeId);
    const result = await folderEnvelope.deleteMany({ folderId: objFolderId, envelopeId: objEnvelopeId });
    return result.deletedCount > 0;
};
const removeUserFromFolder = async (folderId, userId) => {
    const objFolderId = new mongoose.Types.ObjectId(folderId);
    const objUserId = new mongoose.Types.ObjectId(userId);
    const result = await OrgFolderShare.deleteMany({ folderId: objFolderId, sharedWithId: objUserId });
    return result.deletedCount > 0;
};
const removeRoleFromFolder = async (folderId, roleId) => {
    const objFolderId = new mongoose.Types.ObjectId(folderId);
    const objRoleId = new mongoose.Types.ObjectId(roleId);
    const result = await OrgFolderShare.deleteMany({ folderId: objFolderId, sharedWithId: objRoleId });
    return result.deletedCount > 0;
}

module.exports = {
    createOrganization,
    getOrganizationDetails,
    updateOrganizationDetails,
    deleteOrganization,
    getOrganizationsByUserId,
    getAllOrganizations,
    getAllOrganizationsRquest,
    getOrganizationUser,
    getOrganizationRoleById,
    getOrganizationPermissionsByRoleId,
    createFolderInOrganization,
    getFoldersInOrganization,
    getOrganizationMembers,
    createOrganizationRole,
    getOrganizationRoles,
    updateOrganizationRole,
    updateRolePermissions,
    getOrgNotifications,
    getNotificcatoinReadIds,
    addMemberToOrganization,
    getUserInvitationById,
    acceptOrganizationInvitation,
    rejectOrganizationInvitation,
    shareFolder,
    fetchFolderById,
    fetchFolderEnvelopeIds,
    getRolesandUsersByFolderId,
    insertEnvelopesToFolder,
    checkExistingEnvelope,
    updateOrganizationVerficationStatus,
    removeEnvelopeFromFolder,
    removeUserFromFolder,
    removeRoleFromFolder
};