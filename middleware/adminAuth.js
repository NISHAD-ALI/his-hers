  
  const isLogin = async(req,res,next)=>{
    try {

        if(req.session.admin_id){
            next()
        }
        else{
          res.redirect('/admin/adminLogin')
        }
 
        
    } catch (error) {
        console.log(error.message);
    }
  }


  const isLogOut = async(req,res,next)=>{
    try {
        if (!req.session.admin_id) {


          next();
        } else {
          res.redirect('/admin/dashboard');
           
        }
      } catch (error) {
        console.log(error.message);
      }
  }

  module.exports = {
    isLogOut,
    isLogin
  }


