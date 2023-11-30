[1:16 pm, 28/11/2023] Dasan Brototype: const newproduct = async (req, res) => {
    try {
        console.log("jflfjnsdljsdflfl");
        const productname = req.body.product
        const productdata = await product.findOne({ productname: { $regex: new RegExp(productname, 'i') } });
     
        if(productdata){
            console.log('product already exist');
        }else{

        const data = new product({
            productname: req.body.product,
            quantity: req.body.quantity,
            price: req.body.price,
            category: req.body.category,
            description: req.body.description,
            //   image:req.files.image,
            // status:0

        })
        data.image = req.files.map((file) => file.filename);
        const item = await data.save();
        for (let i = 0; i < req.files.length; i++) {
            await sharp("public/productimages/" + req.files[i].filename).resize(800, 800).toFile("public/sharpedimages/" + req.files[i].filename);
        };

        console.log(item);
        if (item) {
            res.redirect('/admin/productmanagement');
        }
        else {
            console.log("Failed upload");
        }}

    }
    catch (error) {
        console.log(error.message);
    }
}
[1:17 pm, 28/11/2023] Dasan Brototype: router.post('/productadd',multer.upload.array('image', 4),adminController.newproduct);
[1:17 pm, 28/11/2023] Dasan Brototype: router.post('/editingproduct',multer.upload.array('image', 4),adminController.editingproduct);
[1:18 pm, 28/11/2023] Dasan Brototype:




<div class="form-group">
<label for="images">Upload Images</label>
<input type="file" accept="image/*" class="form-control-file" id="images" name="image" multiple onchange="validateAndPreviewImages(this)">
<span id="image1Error" style="color: red;"></span>
</div>
<div id="imagePreviewContainer"></div>
<button type="submit" class="btn btn-primary mr-2">Submit</button>
<button class="btn btn-dark"><a href="/admin/productmanagement">Cancel</a></button>
[1:19 pm, 28/11/2023] Dasan Brototype: <script>
// Function to handle new image uploads
function previewImages(input) {
var previewContainer = document.getElementById('imagePreviewContainer');
previewContainer.innerHTML = ''; // Clear previous previews

var files = input.files;
for (var i = 0; i < files.length; i++) {
var reader = new FileReader();

reader.onload = function (e) {
var img = document.createElement('img');
img.src = e.target.result;
img.style.maxWidth = '300px'; // Set a maximum width for the preview image

previewContainer.appendChild(img);
};

reader.readAsDataURL(files[i]);
}
}
</script>

<script>
function deleteImage(productid,imageid){
console.log(productid,"pppp",imageid);
$.ajax({
method:'delete',
url:'/admin/deleteproductimage',
data:JSON.stringify({productid:productid,imageid:imageid}),
contentType:'application/json',
success:function(response){
if(response.result==true){
// $('#existingImagePreview').load('/admin/edit/product #existingImagePreview');
window.location.reload()


}else{
console.log('Error');
}
}
})

}

function updateImage(productid,imageid){
console.log(productid,imageid);

}
</script>

<script>
function validateAndPreviewImages(input) {
var previewContainer = document.getElementById('imagePreviewContainer');
var errorSpan = document.getElementById('image1Error');

// Get the selected files
var files = input.files;

// Define the maximum allowed images
var maxImages = 4;

// Check if the number of selected images exceeds the limit
if (files.length > maxImages) {
// Clear the file input
input.value = '';

// Display an error message
errorSpan.textContent = 'Please upload a maximum of ' + maxImages + ' images.';
errorSpan.style.display = 'block';

// Clear the image preview container
previewContainer.innerHTML = '';
} else {
// Hide any previous error messages
errorSpan.style.display = 'none';

// Proceed with previewing the images
previewImages(input);
}
}

// The rest of your previewImages function goes here
</script>