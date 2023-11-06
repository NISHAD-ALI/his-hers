const user =require('../models/userModel');
const product = require('../models/productModel');
const cart= require('../models/cartModel');

//=================================== CART-MANAGEMENT =====================================//
const cartRendering =async (req,res)=>{

    
    try {
    const id = req.session.userId;
    const data = await cart.find({ userid: id });
    const total = await cart.findOne({ userid: id }).populate('items.total');
    const standard =49
    const express =99
    const datatotal = total.items.map((item) => {
        return item.total * item.count;
    });

    let totalsum = 0;
    if (datatotal.length > 0) {
        totalsum = datatotal.reduce((x, y) => {
            return x + y;
        });
    }

    const cartdata = await cart.find({ userid: id }).populate("items.productid");
    
    if (data) {
        res.render('cart', { user: req.session.name, cartdata, data, id, totalsum,express,standard });
    } else {
        console.log("Your cart is empty.");
    }
}
 catch (error) {
    console.log(error.message);
}
}
//=================================== ADDING TO CART =====================================//


const cartAdding= async(req,res)=>{
    try {
        
       
        const id =req.session.userId
        const productid = req.body.id
       
        const data = await product.findOne({_id:productid});
       console.log(data);
        const cartdata = await cart.findOne({userid:id,"items.productid":productid});
        
        if(id){
        
        if(data.quantity>1){

            if(cartdata){
                console.log("Existing data on cart");
                await cart.updateOne(
                    { userid: id, "items.productid": productid },
                    { $inc: { "items.$.count": 1 } }
                  );
            console.log("Cart product count increased");
            
            }
            else{
               
                const cartitems= {
                    productid:data._id,
                    count:1,
                    total:data.price
                }

                await cart.findOneAndUpdate({userid:id},{$set:{userid:id},$push:{items:cartitems}},{upsert:true,new:true});
                
                console.log('product added to the cart')
                res.json({result:true})

            }
        }
        else{
            res.json({result:false})
        }

        }
        else{
            console.log("Login required");
        }}
     catch (error) {
        console.log(error.message);
        
    }
}

//=================================== ADDING THE COUNT  OF THE PRODUCT =====================================//

const AddingProductCount = async(req,res)=>{
    try {
       
        const productid=req.body.id;
        const id=req.session.userId
        const val =req.body.val
        const data = await product.findOne({_id:productid})
        console.log(data.quantity);
        if(data.quantity >0){
            if(val ==1){
                if(data.quantity >0 ){
             await cart.updateOne(
            { userid: id, "items.productid": productid },
            { $inc: { "items.$.count": 1 } });
            console.log("count increased");
            
            res.json({result:true});
            
            }
            else{
                res.json({result:false})
            }
            }

            else if(val == -1){
                
                await cart.updateOne(
                 { userid: id, "items.productid": productid },
                 { $inc: { "items.$.count": -1 } });
                 console.log("count decreased");
                
                 res.json({result:true})

            }
            
        }
          

    } catch (error) {
        console.log(error.message);
        
    }
}



//=================================== DELETE THE PRODUCT =====================================//

const deleteCartItems = async(req,res)=>{
    try {
        const id = req.query.id
        const sessionid = req.session.userId;
      
       const data= await cart.updateOne({ userid: sessionid }, { $pull: { items: { productid: id } } });
       console.log(data);
       if(data){
       res.redirect('/cart');
       }
       else{
        console.log("error");
       }
        
    } catch (error) {
        console.log(error.message);
        
    }
}

module.exports={
    cartAdding,
    cartRendering,
    AddingProductCount,
    deleteCartItems
}




const addToCart = async (req, res) => {
    try {
      // Get the user ID from the session
      const userId = req.session.user_id;
      console.log(userId);
      
      if (!userId) {
        // Check if the user is logged in
        console.log('Login required');
        return res.json({ result: false, message: 'Login required' });
      }
  
      const productId = req.body.id;
  
      // Find the product data
      const productData = await product.findOne({ _id: productId });
  
      if (!productData) {
        console.log('Product not found');
        return res.json({ result: false, message: 'Product not found' });
      }
  
      // Check if the product is already in the user's cart
      const cartData = await Cart.findOne({ userId: userId, 'products.productId': productId });
  
      if (cartData) {
        // If the product is already in the cart, increase the count
        const existingProduct = cartData.products.find((product) => product.productId === productId);
        existingProduct.count += 1;
        existingProduct.totalPrice = existingProduct.count * existingProduct.productPrice;
        
        await cartData.save();
  
        console.log('Cart product count increased');
      } else {
        // If the product is not in the cart, add it
        const cartItem = {
          productId,
          count: 1,
          productPrice: productData.price,
          totalPrice: productData.price,
        };
  
        cartData.products.push(cartItem);
        await cartData.save();
  
        console.log('Product added to the cart');
      }
  
      res.json({ result: true });
    } catch (error) {
      console.log(error.message);
      res.json({ result: false, message: 'An error occurred' });
    }
  };
  



  <tbody>
  <% products.forEach((value, index) => { %>
    <tr>
      <td class="product-col">
        <div class="product">
          <figure class="product-media">
            <a href="">
              <img src="/products/crop/<%= value.productId.images.image3 %>" alt="Product image">
            </a>
          </figure>
          <h3 class="product-title">
            <a href="/productView?id=<%= value.productId._id %>"><%= value.productId.name %></a>
          </h3>
        </div>
      </td>
      <td class="price-col">₹ <%= value.productId.price %></td>
      <td class="quantity-col">
        <!-- Quantity buttons and input fields -->
      </td>
      <td class="total-col">₹ <%= value.totalPrice %></td>
      <td class="remove-col">
        <button class="btn-remove" onclick="deleteCartItem('<%= value.productId._id %>')">
          <i class="icon-close"></i>
        </button>
      </td>
    </tr>
    <% if (value.productId.quantity === 0) { %>
      <tr>
        <td colspan="5">
          <p style="color: red"><b>Out of Stock !</b></p>
        </td>
      </tr>
    <% } %>
  <% } ) %>
</tbody>


<!DOCTYPE html>
<html lang="en">


<!-- molla/cart.html  22 Nov 2019 09:55:06 GMT -->
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Shozey</title>
    <meta name="keywords" content="HTML5 Template">
    <meta name="description" content="Molla - Bootstrap eCommerce Template">
    <meta name="author" content="p-themes">
    <!-- Favicon -->
    <link rel="apple-touch-icon" sizes="180x180" href="assets/images/icons/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="assets/images/icons/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="assets/images/icons/favicon-16x16.png">
    <link rel="manifest" href="assets/images/icons/site.html">
    <link rel="mask-icon" href="assets/images/icons/safari-pinned-tab.svg" color="#666666">
    <link rel="shortcut icon" href="assets/images/icons/favicon.ico">
    <meta name="apple-mobile-web-app-title" content="Molla">
    <meta name="application-name" content="Molla">
    <meta name="msapplication-TileColor" content="#cc9966">
    <meta name="msapplication-config" content="assets/images/icons/browserconfig.xml">
    <meta name="theme-color" content="#ffffff">
    <!-- Plugins CSS File -->
    <link rel="stylesheet" href="assets/css/bootstrap.min.css">
    <!-- Main CSS File -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>

<body>
    <div class="page-wrapper">
        <header class="header">
           

            <div class="header-middle sticky-header">
                <div class="container">
                    <div class="header-left">
                        <button class="mobile-menu-toggler">
                            <span class="sr-only">Toggle mobile menu</span>
                            <i class="icon-bars"></i>
                        </button>

                        <h1 class="display-4 text-center mt-3" style="color: #00008B; font-weight: bold; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5); font-family: 'Cursive', sans-serif; letter-spacing: 2px; text-transform: uppercase;">SHOZEY</h1>

                        <nav class="main-nav">
                            <ul class="menu sf-arrows">
                                <li class="megamenu-container active">
                                    <a href="/" class="sf-with-ul">Home</a>

                                    
                                </li>
                                <li>
                                    <a href="category.html" class="sf-with-ul">Shop</a>

                                   
                                </li>
                                <li>
                                    <a href="product.html" class="sf-with-ul">Product</a>

                                </li>
                                <li>
                                    <a href="#" class="sf-with-ul">Pages</a>

                                    <ul>
                                        <li>
                                            <a href="about.html" class="sf-with-ul">About</a>

                                            <ul>
                                                <li><a href="about.html">About 01</a></li>
                                                <li><a href="about-2.html">About 02</a></li>
                                            </ul>
                                        </li>
                                        <li>
                                            <a href="contact.html" class="sf-with-ul">Contact</a>

                                            <ul>
                                                <li><a href="contact.html">Contact 01</a></li>
                                                <li><a href="contact-2.html">Contact 02</a></li>
                                            </ul>
                                        </li>
                                        <li><a href="login.html">Login</a></li>
                                        <li><a href="faq.html">FAQs</a></li>
                                        <li><a href="404.html">Error 404</a></li>
                                        <li><a href="coming-soon.html">Coming Soon</a></li>
                                    </ul>
                                </li>
                                <li>
                                    <a href="blog.html" class="sf-with-ul">Blog</a>

                                    <ul>
                                        <li><a href="blog.html">Classic</a></li>
                                        <li><a href="blog-listing.html">Listing</a></li>
                                        <li>
                                            <a href="#">Grid</a>
                                            <ul>
                                                <li><a href="blog-grid-2cols.html">Grid 2 columns</a></li>
                                                <li><a href="blog-grid-3cols.html">Grid 3 columns</a></li>
                                                <li><a href="blog-grid-4cols.html">Grid 4 columns</a></li>
                                                <li><a href="blog-grid-sidebar.html">Grid sidebar</a></li>
                                            </ul>
                                        </li>
                                        <li>
                                            <a href="#">Masonry</a>
                                            <ul>
                                                <li><a href="blog-masonry-2cols.html">Masonry 2 columns</a></li>
                                                <li><a href="blog-masonry-3cols.html">Masonry 3 columns</a></li>
                                                <li><a href="blog-masonry-4cols.html">Masonry 4 columns</a></li>
                                                <li><a href="blog-masonry-sidebar.html">Masonry sidebar</a></li>
                                            </ul>
                                        </li>
                                        <li>
                                            <a href="#">Mask</a>
                                            <ul>
                                                <li><a href="blog-mask-grid.html">Blog mask grid</a></li>
                                                <li><a href="blog-mask-masonry.html">Blog mask masonry</a></li>
                                            </ul>
                                        </li>
                                        <li>
                                            <a href="#">Single Post</a>
                                            <ul>
                                                <li><a href="single.html">Default with sidebar</a></li>
                                                <li><a href="single-fullwidth.html">Fullwidth no sidebar</a></li>
                                                <li><a href="single-fullwidth-sidebar.html">Fullwidth with sidebar</a></li>
                                            </ul>
                                        </li>
                                    </ul>
                                </li>
                                <li>
                                    <% if (!user) { %>
                                        <li>
                                            <a href="#" class="sf-with-ul">Profile</a>
                                            <ul>
                                              <li><a href="/signin">Login</a></li>
                                              <li><a href="/profile">Profile</a></li>
                                              <li><a href="/cart">Cart</a></li>
                                            </ul>
                                          </li>
                                      <% } else { %>
                                        
                                        <li>
                                            <a href="#" class="sf-with-ul"><%= user %></a>
                                            <ul>
                                              <li><a href="/signin">Login</a></li>
                                              <li><a href="/logout">Logout</a></li>
                                              <li><a href="/profile">Profile</a></li>
                                              <li><a href="/cart">Cart</a></li>
                                            </ul>
                                          </li>
                                      <% } %>

                                </li>
                            </ul><!-- End .menu -->
                        </nav><!-- End .main-nav -->
                    </div><!-- End .header-left -->

                    <div class="header-right">
                        <div class="header-search">
                            <a href="#" class="search-toggle" role="button" title="Search"><i class="icon-search"></i></a>
                            <form action="#" method="get">
                                <div class="header-search-wrapper">
                                    <label for="q" class="sr-only">Search</label>
                                    <input type="search" class="form-control" name="q" id="q" placeholder="Search in..." required>
                                </div><!-- End .header-search-wrapper -->
                            </form>
                        </div><!-- End .header-search -->
                        <div class="dropdown compare-dropdown">
                            <a href="#" class="dropdown-toggle" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-display="static" title="Compare Products" aria-label="Compare Products">
                                <i class="icon-random"></i>
                            </a>

                            <div class="dropdown-menu dropdown-menu-right">
                              
                                <ul class="compare-products">
                                    <li class="compare-product">
                                        <a href="#" class="btn-remove" title="Remove Product"><i class="icon-close"></i></a>
                                        <h4 class="compare-product-title"><a href="product.html">Blue Night Dress</a></h4>
                                    </li>
                                    <li class="compare-product">
                                        <a href="#" class="btn-remove" title="Remove Product"><i class="icon-close"></i></a>
                                        <h4 class="compare-product-title"><a href="product.html">White Long Skirt</a></h4>
                                    </li>
                                </ul>

                                <div class="compare-actions">
                                    <a href="#" class="action-link">Clear All</a>
                                    <a href="#" class="btn btn-outline-primary-2"><span>Compare</span><i class="icon-long-arrow-right"></i></a>
                                </div>
                            </div><!-- End .dropdown-menu -->
                        </div><!-- End .compare-dropdown -->

                        <div class="dropdown cart-dropdown" id="downCart">
                            <a href="#" class="dropdown-toggle" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-display="static">
                                <i class="icon-shopping-cart"></i>
                                <span class="cart-count">2</span>
                            </a>

                            <div class="dropdown-menu dropdown-menu-right">
                                <% cartdata.forEach((item)=>{%>
                                    <% item.items.forEach((element)=>{%>
                                <div class="dropdown-cart-products">
                                    <div class="product" >
                                        <div class="product-cart-details">
                                            <h4 class="product-title">
                                                <a href="product.html"><%= element.productid.productname %></a>
                                            </h4>
    
                                            <span class="cart-product-info">
                                                <span class="cart-product-qty"></span>
                                               <%= element.count %> x Rs.<%= element.productid.price * element.count %>
                                            </span>
                                        </div><!-- End .product-cart-details -->
    
                                        <figure class="product-image-container">
                                            <a href="" class="product-image">
                                                <img src="/productimages/<%= element.productid.image[0] %>" alt="product">
                                            </a>
                                        </figure>
                                        <a href="#" class="btn-remove" title="Remove Product"><i class="icon-close"></i></a>
                                    </div><!-- End .product -->
    
                                  
                                    
                                </div><!-- End .cart-product -->
                                <%}) %>
                                <% })%>

                                <div class="dropdown-cart-total">
                                    <span>Total</span>

                                    <span class="cart-total-price">Rs.<%= totalsum %></span>
                                </div><!-- End .dropdown-cart-total -->

                                <div class="dropdown-cart-action">
                                    <a href="/cart" class="btn btn-primary">View Cart</a>
                                    <a href="checkout.html" class="btn btn-outline-primary-2"><span>Checkout</span><i class="icon-long-arrow-right"></i></a>
                                </div><!-- End .dropdown-cart-total -->
                            </div><!-- End .dropdown-menu -->
                        </div><!-- End .cart-dropdown -->
                    </div><!-- End .header-right -->
                </div><!-- End .container -->
            </div><!-- End .header-middle -->
        </header><!-- End .header -->

        <main class="main">
        	<div class="page-header text-center" style="background-image: url('assets/images/page-header-bg.jpg')">
        		<div class="container">
        			<h1 class="page-title">Shopping Cart<span>Shop</span></h1>
        		</div><!-- End .container -->
        	</div><!-- End .page-header -->
            <nav aria-label="breadcrumb" class="breadcrumb-nav">
                <div class="container">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="index.html">Home</a></li>
                        <li class="breadcrumb-item"><a href="#">Shop</a></li>
                        <li class="breadcrumb-item active" aria-current="page">Shopping Cart</li>
                    </ol>
                </div><!-- End .container -->
            </nav><!-- End .breadcrumb-nav -->

            <div class="page-content" id="Cart">
            	<div class="cart">
	                <div class="container">
	                	<div class="row" >
	                		<div class="col-lg-9">
	                			<table class="table table-cart table-mobile">
									<thead>
                                        <p id="shipping" style="color: red;" ></p>
										<tr>
											<th>Product</th>
											<th>Price</th>
											<th>Quantity</th>
											<th>Total</th>
											<th></th>
										</tr>
									</thead>

									<tbody>
										
                                        <% if (id) { %>
                                            <% if (cartdata.length > 0) { %>
                                                <% cartdata.forEach((item) => { %>
                                                    <% item.items.forEach((element) => { %>
                                                        <tr>
                                                            <td class="product-col">
                                                                <div class="product">
                                                                    <figure class="product-media">
                                                                        <a href="#">
                                                                            <img src="/productimages/<%= element.productid.image[0] %>" alt="Product image">
                                                                        </a>
                                                                    </figure>
                                        
                                                                    <h3 class="product-title">
                                                                        <a href="#"><%= element.productid.productname %></a>
                                                                    </h3>
                                                                </div>
                                                            </td>
                                                            <td class="price-col">Rs.<%= element.productid.price %></td>
                                                            <td class="quantity-col">
                                                                <div class="cart-product-quantity">
                                                                    <div class="input-group  input-spinner">
                                                                        <!-- <input type="number" class="form-control" value="<%= element.count %>" min="1" max="10" step="1" data-decimals="0" required> -->
                                                                        <div class="input-group-prepend">
                                                                    <button style="min-width: 26px" class="btn btn-decrement btn-spinner" onclick="AddingCount(-1,'<%= element.productid._id %>')" type="button" fdprocessedid="oe68nu">
                                                                        <i class="icon-minus"></i></button>
                                                                    </div>
                                                                    <input type="text" style="text-align: center" class="form-control " required="" placeholder="" fdprocessedid="kzohym"value="<%= element.count %>">
                                                                    <div class="input-group-append">
                                                                        <button style="min-width: 26px" class="btn btn-increment btn-spinner" onclick="AddingCount(1,'<%= element.productid._id %>')" type="button" fdprocessedid="4dpds">
                                                                            <i class="icon-plus"></i></button>
                                                                        </div>
                                                                    </div>
                                                            </td>
                                                            <td class="total-col">Rs.<%= element.productid.price * element.count %></td>
                                                            <td class="remove-col">
                                                                <a href="/deleteCartItems?id=<%= element.productid._id %>" class="btn-remove">
                                                                    <i class="icon-close"></i>
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    <% }) %>
                                                <% }) %>
                                            <% } else { %>
                                                <tr>
                                                    <td colspan="5">Your cart is empty.</td>
                                                </tr>
                                            <% } %>
                                        <% } else { %>
                                            <tr>
                                                <td>This is the content for the table row.</td>
                                            </tr>
                                        <% } %>
                                        

									</tbody>
								</table><!-- End .table table-wishlist -->

	                			<div class="cart-bottom">
			            			<div class="cart-discount">
			            				<form action="#">
			            					<div class="input-group">
				        						<input type="text" class="form-control" required placeholder="coupon code">
				        						<div class="input-group-append">
													<button class="btn btn-outline-primary-2" type="submit"><i class="icon-long-arrow-right"></i></button>
												</div><!-- .End .input-group-append -->
			        						</div><!-- End .input-group -->
			            				</form>
			            			</div><!-- End .cart-discount -->

			            			<a href="#" class="btn btn-outline-dark-2"><span>UPDATE CART</span><i class="icon-refresh"></i></a>
		            			</div><!-- End .cart-bottom -->
	                		</div><!-- End .col-lg-9 -->
                            <% if(id){%>
	                		<aside class="col-lg-3" >
	                			<div class="summary summary-cart" id="shipping-options">
	                				<h3 class="summary-title">Cart Total</h3><!-- End .summary-title -->

	                				<table class="table table-summary">
	                					<tbody>
	                						<tr class="summary-subtotal" >
	                							<td>Subtotal:</td>
	                							<td >Rs.<%= totalsum %></td>
	                						</tr><!-- End .summary-subtotal -->
	                						<tr class="summary-shipping">
	                							<td>Shipping:</td>
	                							<td>&nbsp;</td>
	                						</tr>

	                						<tr class="summary-shipping-row">
	                							<td>
													<div class="custom-control custom-radio">
														<input type="radio" id="free-shipping" name="shipping" class="custom-control-input">
														<label class="custom-control-label" onclick="sample(0,'<%= totalsum%>')" for="free-shipping">Free Shipping</label>
													</div><!-- End .custom-control -->
	                							</td>
	                							<td>Rs.0.00</td>
	                						</tr><!-- End .summary-shipping-row -->

	                						<tr class="summary-shipping-row">
	                							<td>
	                								<div class="custom-control custom-radio">
														<input type="radio" id="standart-shipping" name="shipping" class="custom-control-input">
														<label class="custom-control-label"  onclick="sample(49,'<%= totalsum%>')" for="standart-shipping">Standart:</label>
													</div><!-- End .custom-control -->
	                							</td>
	                							<td>Rs.<%= standard%></td>
	                						</tr><!-- End .summary-shipping-row -->

	                						<tr class="summary-shipping-row">
	                							<td>
	                								<div class="custom-control custom-radio">
														<input type="radio" id="express-shipping" name="shipping" class="custom-control-input">
														<label class="custom-control-label" onclick="sample(99,'<%= totalsum%>')"  for="express-shipping">Express:</label>
													</div><!-- End .custom-control -->
	                							</td>
	                							<td>Rs.<%= express  %></td>
	                						</tr><!-- End .summary-shipping-row -->

	                						<tr class="summary-shipping-estimate">
	                							<td>Estimate for Your Country<br> <a href="dashboard.html">Change address</a></td>
	                							<td>&nbsp;</td>
	                						</tr><!-- End .summary-shipping-estimate -->

	                						<tr class="summary-total">
	                							<td>Total:</td>
	                							<td id="total" >Rs.<%= totalsum %> </td>
	                						</tr><!-- End .summary-total -->
	                					</tbody>
	                				</table><!-- End .table table-summary -->
                                        
	                				<a href="/ProceedtoCheckout" id="proceed-to-checkout" class="btn btn-outline-primary-2 btn-order btn-block">PROCEED TO CHECKOUT</a>
	                			</div><!-- End .summary -->

		            			<a href="category.html" class="btn btn-outline-dark-2 btn-block mb-3"><span>CONTINUE SHOPPING</span><i class="icon-refresh"></i></a>
	                		</aside><!-- End .col-lg-3 -->
                            <%}%>
                            
	                	</div><!-- End .row -->
	                </div><!-- End .container -->
                </div><!-- End .cart -->
            </div><!-- End .page-content -->
        </main><!-- End .main -->

      <script>
        function AddingCount(val,id){
        console.log("started");
        $.ajax({
            method:"post",
            url:"/AddingProductCount",
            data:JSON.stringify({id:id, val:val}),
            contentType:'application/json',
            success:function(response){
                if(response.result == true){
                   $('#Cart').load('/cart #Cart') 
                   $('#downCart').load('/cart #downCart') 

                } else if(response.result === false){
                    Swal.fire({
                    title:'OUT OF STOCK',
                    text:'product is out of stock',
                    icon:'failed',
                    confirmButtonText:'OK'
                });
                }
            }


        })
    }

    document.addEventListener("DOMContentLoaded", () => {
    const cart = document.getElementById('cart');
    const shipping = document.getElementById('shipping-options');
    const proceedCheckout = document.getElementById('proceed-to-checkout');

    proceedCheckout.addEventListener('click', (event) => {
        const selectedShipping = document.querySelector('input[name="shipping"]:checked');

        if (selectedShipping) {
            const shippingMethod = selectedShipping.value;
            console.log("Selected shipping method: " + shippingMethod);
        } else {
            const errorElement = document.getElementById('shipping');
            errorElement.textContent = 'Please select a shipping method before proceeding.';
            event.preventDefault(); 
        }
    });
});

function sample(val,totalsum) {
const finalamount = parseInt(val) + parseInt(totalsum);
console.log(finalamount);
const result = document.querySelector('#total');
result.textContent = "Rs" + parseInt(finalamount);
}

        </script>

        
<%- include('../user/layout/footer.ejs') -%></div>



const user =require('../models/userModel');
const product = require('../models/productModel');
const cart= require('../models/cartModel');

//=================================== CART-MANAGEMENT =====================================//
const cartRendering =async (req,res)=>{

    
    try {
    const id = req.session.userId;
    const data = await cart.find({ userid: id });
    const total = await cart.findOne({ userid: id }).populate('items.total');
    const standard =49
    const express =99
    const datatotal = total.items.map((item) => {
        return item.total * item.count;
    });

    let totalsum = 0;
    if (datatotal.length > 0) {
        totalsum = datatotal.reduce((x, y) => {
            return x + y;
        });
    }

    const cartdata = await cart.find({ userid: id }).populate("items.productid");
    
    if (data) {
        res.render('cart', { user: req.session.name, cartdata, data, id, totalsum,express,standard });
    } else {
        console.log("Your cart is empty.");
    }
}
 catch (error) {
    console.log(error.message);
}
}
//=================================== ADDING TO CART =====================================//


const cartAdding= async(req,res)=>{
    try {
        
       
        const id =req.session.userId
        const productid = req.body.id
       
        const data = await product.findOne({_id:productid});
       console.log(data);
        const cartdata = await cart.findOne({userid:id,"items.productid":productid});
        
        if(id){
        
        if(data.quantity>1){

            if(cartdata){
                console.log("Existing data on cart");
                await cart.updateOne(
                    { userid: id, "items.productid": productid },
                    { $inc: { "items.$.count": 1 } }
                  );
            console.log("Cart product count increased");
            
            }
            else{
               
                const cartitems= {
                    productid:data._id,
                    count:1,
                    total:data.price
                }

                await cart.findOneAndUpdate({userid:id},{$set:{userid:id},$push:{items:cartitems}},{upsert:true,new:true});
                
                console.log('product added to the cart')
                res.json({result:true})

            }
        }
        else{
            res.json({result:false})
        }

        }
        else{
            console.log("Login required");
        }}
     catch (error) {
        console.log(error.message);
        
    }
}

//=================================== ADDING THE COUNT  OF THE PRODUCT =====================================//

const AddingProductCount = async(req,res)=>{
    try {
       
        const productid=req.body.id;
        const id=req.session.userId
        const val =req.body.val
        const data = await product.findOne({_id:productid})
        const cartitems = await cart.findOne({userid:id}).populate("items.productid") 
        
      
        
        if(data.quantity >0 ){
            if(val ==1){
                if(data.quantity >0  ){
             await cart.updateOne(
            { userid: id, "items.productid": productid },
            { $inc: { "items.$.count": 1 } });
            console.log("count increased");
            
            res.json({result:true});
            
            }
            else{
                res.json({result:false})
            }
            }

            else if(val == -1){
                
                await cart.updateOne(
                 { userid: id, "items.productid": productid },
                 { $inc: { "items.$.count": -1 } });
                 console.log("count decreased");
                
                 res.json({result:true})

            }
            
        }
          

    } catch (error) {
        console.log(error.message);
        
    }
}



//=================================== DELETE THE PRODUCT =====================================//

const deleteCartItems = async(req,res)=>{
    try {
        const id = req.query.id
        const sessionid = req.session.userId;
      
       const data= await cart.updateOne({ userid: sessionid }, { $pull: { items: { productid: id } } });
       console.log(data);
       if(data){
       res.redirect('/cart');
       }
       else{
        console.log("error");
       }
        
    } catch (error) {
        console.log(error.message);
        
    }
}

module.exports={
    cartAdding,
    cartRendering,
    AddingProductCount,
    deleteCartItems
}



const user =require('../models/userModel');
const product = require('../models/productModel');
const cart= require('../models/cartModel');

//=================================== CART-MANAGEMENT =====================================//
const cartRendering =async (req,res)=>{

    
    try {
    const id = req.session.userId;
    const data = await cart.find({ userid: id });
    const total = await cart.findOne({ userid: id }).populate('items.total');
    const standard =49
    const express =99
    const datatotal = total.items.map((item) => {
        return item.total * item.count;
    });

    let totalsum = 0;
    if (datatotal.length > 0) {
        totalsum = datatotal.reduce((x, y) => {
            return x + y;
        });
    }

    const cartdata = await cart.find({ userid: id }).populate("items.productid");
    
    if (data) {
        res.render('cart', { user: req.session.name, cartdata, data, id, totalsum,express,standard });
    } else {
        console.log("Your cart is empty.");
    }
}
 catch (error) {
    console.log(error.message);
}
}
//=================================== ADDING TO CART =====================================//


const cartAdding= async(req,res)=>{
    try {
        
       
        const id =req.session.userId
        const productid = req.body.id
       
        const data = await product.findOne({_id:productid});
       console.log(data);
        const cartdata = await cart.findOne({userid:id,"items.productid":productid});
        
        if(id){
        
        if(data.quantity>1){

            if(cartdata){
                console.log("Existing data on cart");
                await cart.updateOne(
                    { userid: id, "items.productid": productid },
                    { $inc: { "items.$.count": 1 } }
                  );
            console.log("Cart product count increased");
            
            }
            else{
               
                const cartitems= {
                    productid:data._id,
                    count:1,
                    total:data.price
                }

                await cart.findOneAndUpdate({userid:id},{$set:{userid:id},$push:{items:cartitems}},{upsert:true,new:true});
                
                console.log('product added to the cart')
                res.json({result:true})

            }
        }
        else{
            res.json({result:false})
        }

        }
        else{
            console.log("Login required");
        }}
     catch (error) {
        console.log(error.message);
        
    }
}

//=================================== ADDING THE COUNT  OF THE PRODUCT =====================================//

const AddingProductCount = async(req,res)=>{
    try {
       
        const productid=req.body.id;
        const id=req.session.userId
        const val =req.body.val
        const data = await product.findOne({_id:productid})
        const cartitems = await cart.findOne({userid:id}).populate("items.productid") 
        
      
        
        if(data.quantity >0 ){
            if(val ==1){
                if(data.quantity >0  ){
             await cart.updateOne(
            { userid: id, "items.productid": productid },
            { $inc: { "items.$.count": 1 } });
            console.log("count increased");
            
            res.json({result:true});
            
            }
            else{
                res.json({result:false})
            }
            }

            else if(val == -1){
                
                await cart.updateOne(
                 { userid: id, "items.productid": productid },
                 { $inc: { "items.$.count": -1 } });
                 console.log("count decreased");
                
                 res.json({result:true})

            }
            
        }
          

    } catch (error) {
        console.log(error.message);
        
    }
}



//=================================== DELETE THE PRODUCT =====================================//

const deleteCartItems = async(req,res)=>{
    try {
        const id = req.query.id
        const sessionid = req.session.userId;
      
       const data= await cart.updateOne({ userid: sessionid }, { $pull: { items: { productid: id } } });
       console.log(data);
       if(data){
       res.redirect('/cart');
       }
       else{
        console.log("error");
       }
        
    } catch (error) {
        console.log(error.message);
        
    }
}

module.exports={
    cartAdding,
    cartRendering,
    AddingProductCount,
    deleteCartItems
}























const placeOrder = async (req, res) => {
    try {
      const id = req.session.user_id;
      const address = req.body.address;
      const cartData = await Cart.findOne({ userId: req.session.user_id });
      const products = cartData.products;
      const total = parseInt(req.body.Total);
      const paymentMethods = req.body.payment;
      const userData = await User.findOne({ _id: id });
      const name = userData.name;
      const uniNum = Math.floor(Math.random() * 900000) + 100000;
      const status = paymentMethods === "COD" ? "placed" : "pending";
      const statusLevel = status === "placed" ? 1: 0;
      const walletBalance = userData.wallet;
      const code = req.body.code;
      //user limit decreasing
      await Coupon.updateOne({couponCode:code},{$inc:{usersLimit: -1 }})
      //user name adding
      await Coupon.updateOne({couponCode:code},{$push:{usedUsers:req.session.user_id}})
  
      const order = new Order({
        deliveryDetails: address,
        uniqueId: uniNum,
        userId: id,
        userName: name,
        paymentMethod: paymentMethods,
        products: products,
        totalAmount: total,
        date: new Date(),
        status: status,
        statusLevel: statusLevel
  
      });
  
      const orderData = await order.save();
      const orderid = order._id;
  
      if (orderData) {
        //--------------------CASH ON DELIVERY-------------------//
  
        if (order.status === "placed") {
          await Cart.deleteOne({ userId: req.session.user_id });
          for (let i = 0; i < products.length; i++) {
            const pro = products[i].productId;
            const count = products[i].count;
            await Product.findOneAndUpdate(
              { _id: pro },
              { $inc: { quantity: -count } }
            );
          }
          if(req.session.code){
            const coupon = await Coupon.findOne({couponCode:req.session.code});
            const disAmount = coupon.discountAmount;
            await Order.updateOne({_id:orderid},{$set:{discount:disAmount}});
            res.json({ codsuccess: true, orderid });
          }
          res.json({ codsuccess: true, orderid });
        } else {