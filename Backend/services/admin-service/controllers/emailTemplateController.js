const { servicePost, serviceGet, servicePut, serviceDel } = require("../utils/apiHelper");
const createEmailTemplate = async(req, res) =>{
    const adminId = req?.user?.data?.id;
    const payload = req.body;
    const isAdmin = true;
    if(!payload.name || !payload.template_Slug || !payload.design || !payload.html){
        return res.status(401).json({success:false, message:"Required parameters are missing."});
    }
    payload.isAdmin = isAdmin;
    payload.createdBy = adminId;
    console.log('Admin Id', adminId);
    try{
        const result = await servicePost(req, 'email', {
            url:'/admin/template/create',
            data:payload
        });
        if(result.status ==200){
            return res.status(200).json({
                status:200,
                message:'Email template created successfully',
                data:result.data.data
            });
        }else{
            return res.status(result.status).json({
                status:result.status,
                message:result.message || 'Something went wrong. Please try again later!',
                data: result.data|| null
            });
        }

        }catch (err){
            console.log('Error:',err);
            return res.status(500).json({error:'Internal Server Error'});
        }
    }
const getEmailTemplates = async(req, res)=>{
try{
    const result  = await serviceGet(req,'email',{
        url:'/admin/template/get-all/admin'
    });
    if(result.status ==200){
        return res.status(200).json({
            status:200,
            message:'Email template fetched.',
            data:result.data.data
        });
    }else{
        return res.status(result.status).json({
            success:false,
            message:result.message || "Something went wrong please try again later!"
        });
    }
  }catch (err){
    console.log(err);
    return res.status(500).json({success:false, message: "Internal Server Error."})
  }
}
const updateEmailTemplates = async(req, res)=>{
    const{id} = req.params;
    const adminId = req?.user?.data?.id;
    const payload = req.body;
    const isAdmin = true;
    if(!payload.name || !payload.template_Slug || !payload.design || !payload.html){
        return res.status(401).json({success:false, message:"Required parameters are missing."});
    }
    payload.isAdmin = isAdmin;
    payload.createdBy = adminId;
    console.log('Admin Id', adminId);
    try{
        const result = await servicePut(req,'email',{
            url:`/admin/template/update/${id}`,
            data:payload
        });
    if(result.status ==200){
        return res.status(200).json({
            status:200,
            success:false,
            message:'Email template updated successfully',
            data:result.data.data
        });
    }else{
        return res.status(result.status).json({
            status:result.status,
            message:result.message ||'Something went wrong please try again later!',
            data:result?.data || null
        })
    }
    }catch (err){
        console.log(err);
        return res.status(500).json({
            status:500,
            success:false,
            message:'Internal Server error'
        });
    }
}
const deleteEmailTemplate = async(req, res)=>{
    const {id} = req.params;
    console.log('Template id in admin panel',id);
    try{
        const result = await serviceDel(req,'email',{
            url:`/admin/template/delete/${id}`
        });
        if(result.status==200){
            return res.status(200).json({
                status:200,
                success:true,
                message:"Template deleted successfully."
            });
        }else{
            return res.status(result.status).json({
                status:result.status,
                success:false,
                message:result.message || 'Something went wrong please try again later!'
            })
        }
    }catch (err){
        console.log(err);
        return res.status(500).json({
            status:500,
            success:false,
            message:"Internal Server Error"
        });
    }
}
module.exports = {createEmailTemplate,getEmailTemplates,updateEmailTemplates,deleteEmailTemplate}