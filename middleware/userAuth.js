  
  const isLogin = async(req,res,next)=>{
    try {

        if(req.session.user_id){
            next()
        }
        else{
            res.redirect('/login')
        }
 
        
    } catch (error) {
        console.log(error.message);
    }
  }


  const isLogOut = async(req,res,next)=>{
    try {
        if (!req.session.user_id) {
          next();
        } else {
          res.redirect('/');
           // Redirect to the home page if the user is logged in
        }
      } catch (error) {
        console.log(error.message);
      }
  }

  module.exports = {
    isLogOut,
    isLogin
  }