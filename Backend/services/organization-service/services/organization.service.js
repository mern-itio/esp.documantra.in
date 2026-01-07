const Organization = require('../models/organization');
const organizationUser = require('../models/organizationUser');
const organizationRole = require('../models/organizationRole');
const organizationPermission = require('../models/organizationPermission');
const orgFolder = require('../models/orgFolder');
const OrgFolderShare = require('../models/orgFolderShare');
const folderEnvelope = require('../models/folderEnvelope');

const mongoose = require('mongoose');
const createOrganization = async (payload, userId) => {
    const { name, logo, website, gst } = payload;

    if (!name?.trim()) {
        throw new Error('Organization name is required');
    }

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
        logo: logo || undefined,
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
    const result = await Organization.findByIdAndUpdate(orgId, payload, { new: true });
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
const getOrganizationsByUserId = async (userId) => {
  const objectId = new mongoose.Types.ObjectId(userId);

  const organizations = await Organization.aggregate([
    // 1. Organizations the user owns
    {
      $match: { createdBy: objectId }
    },
    {
      $addFields: { isOwner: true }
    },

    // 2. Union with organizations shared with the user
    {
      $unionWith: {
        coll: "organizationusers", // collection name for OrganizationUser
        pipeline: [
          { $match: { userId: objectId } },
          {
            $lookup: {
              from: "organizations",
              localField: "organizationId",
              foreignField: "_id",
              as: "organization"
            }
          },
          { $unwind: "$organization" },
          {
            $project: {
              organization: 1,
              isOwner: { $literal: false }
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
            orgId,
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
    const orgPermissions = await organizationPermission.findById(roleId).lean();
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
const getFoldersInOrganization = async (orgId, userId)=>{
    userId =  new mongoose.Types.ObjectId(userId);
    orgId = new mongoose.Types.ObjectId(orgId);
    const orgUser = await organizationUser.findOne({
      organizationId:orgId,
      userId,
      status: 'ACTIVE'
    })
      .select('roleId')
      .lean();

    const userRoleId = orgUser?.roleId || null;
    const folders = await orgFolder.aggregate([
      {
        $match: { organizationId:orgId }
      },

      /* -------- Folder shares -------- */
      {
        $lookup: {
          from: 'OrgFolderShare',
          localField: '_id',
          foreignField: 'folderId',
          as: 'shares'
        }
      },

      /* -------- Folder envelopes -------- */
      {
        $lookup: {
          from: 'folderEnvelope',
          localField: '_id',
          foreignField: 'folderId',
          as: 'envelopes'
        }
      },

      /* -------- Ownership -------- */
      {
        $addFields: {
          isOwner: { $eq: ['$createdBy', userId] }
        }
      },

      /* -------- Resolve permissions ONLY for requesting user -------- */
      {
        $addFields: {
          permissions: {
            $cond: [
              '$isOwner',
              null,
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
                              { $eq: ['$$s.sharedWithId', userId] }
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

      /* -------- Access filter -------- */
      {
        $match: {
          $or: [
            { isOwner: true },
            { permissions: { $ne: null } }
          ]
        }
      },

      /* -------- Shared people & roles (ALL, ids only) -------- */
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
          sharedRole: {
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

      /* -------- Final shape -------- */
      {
        $project: {
          _id: 1,
          organization_id: '$organizationId',
          folderName: '$name',
          ownerId: '$createdBy',
          isOwner: 1,
          permissions: 1,
          sharedPeople: 1,
          sharedRole: 1,
          envelopes: {
            $map: {
              input: '$envelopes',
              as: 'e',
              in: '$$e.envelopeId'
            }
          },
          color: 1,
          createdAt:1
        }
      }
    ]);

    return folders;
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
    getFoldersInOrganization
};