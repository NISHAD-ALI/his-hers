const addtowishlist =async(req,res)=>{
    try {
        const id = req.body.id
        const session = req.session.userId
        const productddata = await product.findOne({_id:id})
        const wishlistdata = await wishlist.findOne({userid:session})
        const checkwishlistdata = await wishlist.findOne({userid:session,productid:id})
        
        
        if(session){
            if(wishlistdata){
                if(checkwishlistdata){
                    res.json({res:false})
                }else{
                await wishlist.updateOne({userid:session},{$push:{productid:id}})
                res.json({result:true})}
            }else{
            const data = new wishlist({
                userid:session,
                productid:id
            })

            await data.save()
            res.json({result:true})
        }}
        else{
            res.json({result:false})
        }
       
       
        
    } catch (error) {
        console.log(error.message);
        
    }
}

const wishlistview = async(req,res)=>{
    try {
        const id =req.session.userId
        const data = await product.find()
        const cartdata = await cart.find({ userid: id }).populate("items.productid")

        if(id){
            const wishlistdata = await wishlist.find({userid:req.session.userId}).populate("productid");
            
           
       res.render('wishlist',{wishlistdata,user:req.session.name,data,cartdata})
        }
    } catch (error) {
       console.log(error.message); 
    }
} 


const deletewishlist = async(req,res)=>{
    try {
        const id = req.session.userId
        const productid = req.body.productid
        if(productid){
            await wishlist.updateOne({userid:id},{$pull:{productid:productid}})
            res.json({result:true})
        }else{
            console.log("productid is not there");
        }
        
        
    } catch (error) {
        console.log(error.message);
    }
}