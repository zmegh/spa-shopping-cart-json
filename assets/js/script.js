$(function () {

setCartCount();
	// Globals variables

		// 	An array containing objects with information about the products.
	var products = [],

		// Our filters object will contain an array of values for each filter

		// Example:
		// filters = {
		// 		"manufacturer" = ["Apple","Sony"],
		//		"storage" = [16]
		//	}
		filters = {};


	//Event handlers for frontend navigation
	
	//cart
	$(".navbar-right").click(function(){
	
	if( $(".shopping-cart").is(":visible") ){
		log('visible' + $(".shopping-cart").css('display'));
	
		$(".shopping-cart").hide();
		return false;
	}
		var xhr_dlogin = $.get( "views/cart.html", function( cart_view ) {
		
			var $total = parseFloat(localStorage.getItem("cart_total"), 10).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,").toString();
			cart_view = cart_view.replace("{{cart_total}}", $total);
			$( "nav" ).append( cart_view );
			
		}).done(function(){
		 
			var $cart_data = [];
	  
			  if(localStorage.getItem("cart")){
				$cart_data = JSON.parse(localStorage.getItem("cart"));
			  }
				
				if(!$cart_data || $cart_data.length <1){
					$("#btnEmptyCart").trigger("click");
				}
				
			  
			  
			$("#btnEmptyCart").click(function(){
					if(localStorage.getItem("cart")){
					log('in empty car');
						localStorage.removeItem("cart");
						$("#btnCheckout").disabled = true;
						$("#btnEmptyCart").disabled = true;
						$(".shopping-cart").hide();
						setCartCount();
				}
				$(".main-color-text").html('$0');
			});
			
			var list = $('.shopping-cart-items');
			
			var theTemplateScript = $("#cart-template").html();
			
			var theTemplate = Handlebars.compile(theTemplateScript);
			list.append(theTemplate($cart_data));
		}//end done function
	  );
	});
	
	//	Checkbox filtering
	var checkboxes = $('.all-products input[type=checkbox]');
	
	
	checkboxes.click(function () {

		var that = $(this),
			specName = that.attr('name');

		// When a checkbox is checked we need to write that in the filters object;
		if(that.is(":checked")) {

			// If the filter for this specification isn't created yet - do it.
			if(!(filters[specName] && filters[specName].length)){
				filters[specName] = [];
			}

			//	Push values into the chosen filter array
			filters[specName].push(that.val());

			// Change the url hash;
			createQueryHash(filters);

		}

		// When a checkbox is unchecked we need to remove its value from the filters object.
		if(!that.is(":checked")) {

			if(filters[specName] && filters[specName].length && (filters[specName].indexOf(that.val()) != -1)){

				// Find the checkbox value in the corresponding array inside the filters object.
				var index = filters[specName].indexOf(that.val());

				// Remove it.
				filters[specName].splice(index, 1);

				// If it was the last remaining value for this specification,
				// delete the whole array.
				if(!filters[specName].length){
					delete filters[specName];
				}

			}

			// Change the url hash;
			createQueryHash(filters);
		}
	});

	// When the "Clear all filters" button is pressed change the hash to '#' (go to the home page)
	$('.filters button').click(function (e) {
		e.preventDefault();
		window.location.hash = '#';
	});


	// Single product page buttons

	var singleProductPage = $('.single-product');

	singleProductPage.on('click', function (e) {

		if (singleProductPage.hasClass('visible')) {

			var clicked = $(e.target);

			// If the close button or the background are clicked go to the previous page.
			if (clicked.hasClass('close') || clicked.hasClass('overlay')) {
				// Change the url hash with the last used filters.
				createQueryHash(filters);
			}

		}

	});

	// These are called on page load

	// Get data about our products from products.json.
	$.getJSON( "dress.json", function( data ) {

		// Write the data into our global variable.
		products = data;

		// Call a function to create HTML for all the products.
		generateAllProductsHTML(products);

		// Manually trigger a hashchange to start the app.
		$(window).trigger('hashchange');
	});


	// An event handler with calls the render function on every hashchange.
	// The render function will show the appropriate content of out page.
	$(window).on('hashchange', function(){
		render(window.location.hash);
	});


	// Navigation

	function render(url) {

		// Get the keyword from the url.
		var temp = url.split('/')[0];

		// Hide whatever page is currently shown.
		$('.main-content .page').removeClass('visible');


		var	map = {

			// The "Homepage".
			'': function() {

				// Clear the filters object, uncheck all checkboxes, show all the products
				filters = {};
				checkboxes.prop('checked',false);

				renderProductsPage(products);
			},

			// Single Products page.
			'#product': function() {

				// Get the index of which product we want to show and call the appropriate function.
				var index = url.split('#product/')[1].trim();

				renderSingleProductPage(index, products);
			},

			// Page with filtered products
			'#filter': function() {

				// Grab the string after the '#filter/' keyword. Call the filtering function.
				url = url.split('#filter/')[1].trim();

				// Try and parse the filters object from the query string.
				try {
					filters = JSON.parse(url);
				}
					// If it isn't a valid json, go back to homepage ( the rest of the code won't be executed ).
				catch(err) {
					window.location.hash = '#';
					return;
				}

				renderFilterResults(filters, products);
			}

		};

		// Execute the needed function depending on the url keyword (stored in temp).
		if(map[temp]){
			map[temp]();
		}
		// If the keyword isn't listed in the above - render the error page.
		else {
			renderErrorPage();
		}

	}


	// This function is called only once - on page load.
	// It fills up the products list via a handlebars template.
	// It recieves one parameter - the data we took from products.json.
	function generateAllProductsHTML(data){

		var list = $('.all-products .products-list');

		var theTemplateScript = $("#products-template").html();
		//Compile the template​
		var theTemplate = Handlebars.compile (theTemplateScript);
		list.append (theTemplate(data));

		var cart_button = $('#btnCart');

		list.find('button').on('click', function(e){
			var that = $(this);
			fnAddToCart(that.data("product_id"));
		});
	

		// Each products has a data-index attribute.
		// On click change the url hash to open up a preview for this product only.
		// Remember: every hashchange triggers the render function.
		list.find('li .clickable').on('click', function (e) {
			e.preventDefault();
			
			var productIndex = $(this).parent().data('index');
			window.location.hash = 'product/' + productIndex;
		})
	}

	// This function receives an object containing all the product we want to show.
	function renderProductsPage(data){
//https://jsfiddle.net/ryh0nk8r/
		var page = $('.all-products'),
			allProducts = $('.all-products .products-list > li');

		// Hide all the products in the products list.
		//allProducts.addClass('hidden');

		// Iterate over all of the products.
		// If their ID is somewhere in the data object remove the hidden class to reveal them.
		allProducts.each(function () {

			var that = $(this);

			data.forEach(function (item) {
				if(that.data('index') == item.id){
					that.removeClass('hidden');
				}
			});
		});

		// Show the page itself.
		// (the render function hides all pages so we need to show the one we want).
		page.addClass('visible');

	}


	// Opens up a preview for one of the products.
	// Its parameters are an index from the hash and the products object.
	function renderSingleProductPage(index, data){

		var page = $('.single-product'),
			container = $('.preview-large');

		// Find the wanted product by iterating the data object and searching for the chosen index.
		
		if(data.length){
		
			data.forEach(function (item) {
			
				if(item.id == index){
				
					// Populate '.preview-large' with the chosen product's data.
					container.find('.product-price').text("USD $" + item.price);
					container.find('.product-description').text(item.description);
					container.find('img').attr('src', item.image_link);
					
					var $button = container.find('button');
					$button.attr( "data-pid", item.id );
				}
			});
		}

		// Show the page.
		page.addClass('visible');

	}

	// Find and render the filtered data results. Arguments are:
	// filters - our global variable - the object with arrays about what we are searching for.
	// products - an object with the full products list (from product.json).
	function renderFilterResults(filters, products){

			// This array contains all the possible filter criteria.
		var criteria = ['manufacturer','storage','os','camera'],
			results = [],
			isFiltered = false;

		// Uncheck all the checkboxes.
		// We will be checking them again one by one.
		checkboxes.prop('checked', false);


		criteria.forEach(function (c) {

			// Check if each of the possible filter criteria is actually in the filters object.
			if(filters[c] && filters[c].length){


				// After we've filtered the products once, we want to keep filtering them.
				// That's why we make the object we search in (products) to equal the one with the results.
				// Then the results array is cleared, so it can be filled with the newly filtered data.
				if(isFiltered){
					products = results;
					results = [];
				}


				// In these nested 'for loops' we will iterate over the filters and the products
				// and check if they contain the same values (the ones we are filtering by).

				// Iterate over the entries inside filters.criteria (remember each criteria contains an array).
				filters[c].forEach(function (filter) {

					// Iterate over the products.
					products.forEach(function (item){

						// If the product has the same specification value as the one in the filter
						// push it inside the results array and mark the isFiltered flag true.

						if(typeof item.specs[c] == 'number'){
							if(item.specs[c] == filter){
								results.push(item);
								isFiltered = true;
							}
						}

						if(typeof item.specs[c] == 'string'){
							if(item.specs[c].toLowerCase().indexOf(filter) != -1){
								results.push(item);
								isFiltered = true;
							}
						}

					});

					// Here we can make the checkboxes representing the filters true,
					// keeping the app up to date.
					if(c && filter){
						$('input[name='+c+'][value='+filter+']').prop('checked',true);
					}
				});
			}

		});

		// Call the renderProductsPage.
		// As it's argument give the object with filtered products.
		renderProductsPage(results);
	}


	// Shows the error page.
	function renderErrorPage(){
		var page = $('.error');
		page.addClass('visible');
	}

	// Get the filters object, turn it into a string and write it into the hash.
	function createQueryHash(filters){

		// Here we check if filters isn't empty.
		if(!$.isEmptyObject(filters)){
			// Stringify the object via JSON.stringify and write it after the '#filter' keyword.
			window.location.hash = '#filter/' + JSON.stringify(filters);
		}
		else{
			// If it's empty change the hash to '#' (the homepage).
			window.location.hash = '#';
		}

	}
	
	function fnAddToCart($pid){
	$(".shopping-cart").hide();
		products.forEach(function (item) {
		
			var cart = [];
			
			if(localStorage.getItem("cart")){
				//localStorage.removeItem("cart");
				cart = JSON.parse(localStorage.getItem("cart"));
			}
			
				if($pid == item.id){
						var $cart_total=0.0;
						var $dup = false;
						var item = {
							id: item.id,
							price: item.price,
							description: item.description,
							qty:1,
							image_link: item.image_link.trim()
						};
						var index=0;
						$.each(cart, function(i, product){
							
							if(product.id == item.id)
							{
								
								var existing_qty = parseInt(product["qty"]);
								
								$dup = true;
								product["qty"] = existing_qty + 1;
								
								var temp =  jQuery.extend(true, {}, product);
								log('temp ' + JSON.stringify(temp));
								cart.splice(index, 1);
								cart.push(temp);
								log(existing_qty + ' ' + temp["qty"] + ' ' + JSON.stringify(cart));
								return;
							}
							
							index++;
						});
						
						if(!$dup){
							cart.push(item);
						}
						
						$.each(cart, function(i, product){
						log('total ' + product["price"]);
							$cart_total += parseFloat(product["price"]) * parseInt(product["qty"]);
						});
						
						localStorage.setItem("cart_total", $cart_total);
						localStorage.setItem("cart", JSON.stringify(cart));
						setCartCount();
						
						return;
				}
			});
			
		
	}

	function setCartCount(){
	
		if(!localStorage.getItem("cart")){
				$(".badge").html('');
				$(".badge").hide();
				return false;
			}

		cart = JSON.parse(localStorage.getItem("cart"));
		
		if(cart.length <1) return false;
		
		$(".badge").show();
		$(".badge").html(getCartCount());
	}
	
	function getCartCount(){
		var $cart_count = 0;
		
		if(!localStorage.getItem("cart"))
		return 0;
		
		var $cart_data = JSON.parse(localStorage.getItem("cart"));
		
			$.each($cart_data, function(i, product){
					log(product["qty"]);
				$cart_count += parseInt(product["qty"]);
			});
			
			return $cart_count;
	}
	
	function log(_text){
		console.log(_text);
	}
});