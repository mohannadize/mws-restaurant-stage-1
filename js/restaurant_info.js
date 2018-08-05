if (location.pathname.search("restaurant.html") === 1) {
    let restaurant;
    var map;

    /**
     * Initialize Google map, called from HTML.
     */
    window.init = () => {
        fetchRestaurantFromURL((error, restaurant) => {
            if (error) { // Got an error!
                console.error(error);
            } else {
                fillBreadcrumb();
            }
        });
    }


    /**
     * Get current restaurant from page URL.
     */
    fetchRestaurantFromURL = (callback) => {
        if (self.restaurant) { // restaurant already fetched!
            callback(null, self.restaurant)
            return;
        }
        const id = getParameterByName('id');
        if (!id) { // no id found in URL
            error = 'No restaurant id in URL'
            callback(error, null);
        } else {
            DBHelper.fetchRestaurantById(id, (error, restaurant) => {
                self.restaurant = restaurant;
                if (!restaurant) {
                    console.error(error);
                    return;
                }
                fillRestaurantHTML();
                callback(null, restaurant)
            });
        }
    }

    /**
     * Create restaurant HTML and add it to the webpage
     */
    fillRestaurantHTML = (restaurant = self.restaurant) => {
        const name = document.getElementById('restaurant-name');
        name.innerHTML = restaurant.name;

        const favorite = document.getElementById('favorite-btn');
        const a = document.createElement("a");
        // favorite.classList.add("fav-btn");
        a.innerHTML = "<span>Favorite</span> " + starIcon;
        a.href = "javascript:void(0)";
        a.setAttribute("aria-label", `Favorite ${restaurant.name} restaurant`);
        a.setAttribute("role", "button");
        if (self.restaurant.is_favorite) a.classList.add("active");
        a.onclick = function () {
            this.classList.toggle("active");
            DBHelper.favorite(restaurant.id);
        }
        a.addEventListener("keydown", function (e) {
            if (e.keyCode == 13 || e.keyCode == 32) {
                e.preventDefault();
                this.click();
            }
        })
        favorite.appendChild(a);
        // const restaurantCont = document.getElementById("restaurant-container");
        // name.append(favorite);

        const address = document.getElementById('restaurant-address');
        address.innerHTML = restaurant.address;

        const image = document.getElementById('restaurant-img');
        image.className = 'restaurant-img';
        image.setAttribute('alt', `An image of the ${restaurant.name} restaurant.`);
        const images = DBHelper.imageUrlForRestaurant(restaurant);
        image.src = images[0];
        image.setAttribute('srcset', `${images[1]} 400w, ${images[0]} 800w`);

        const cuisine = document.getElementById('restaurant-cuisine');
        cuisine.innerHTML = restaurant.cuisine_type;

        // fill operating hours
        if (restaurant.operating_hours) {
            fillRestaurantHoursHTML();
        }
        fetch(`http://${location.hostname}:1337/reviews/?restaurant_id=` + restaurant.id)
            .then(e => e.json()).then(e => fillReviewsHTML(e))
        // fill reviews
    }

    /**
     * Create restaurant operating hours HTML table and add it to the webpage.
     */
    fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
        const hours = document.getElementById('restaurant-hours');
        for (let key in operatingHours) {
            const row = document.createElement('tr');

            const day = document.createElement('td');
            day.innerHTML = key;
            row.appendChild(day);

            const time = document.createElement('td');
            time.innerHTML = operatingHours[key];
            row.appendChild(time);

            hours.appendChild(row);
        }
    }

    let rating = {};
    /**
     * Create all reviews HTML and add them to the webpage.
     */
    fillReviewsHTML = (reviews = self.restaurant.reviews) => {
        const container = document.getElementById('reviews-container');
        container.tabIndex = 0;
        const title = document.createElement('h3');
        title.innerHTML = 'Reviews';
        container.appendChild(title);

        // Comment Form
        const form = document.createElement("form");
        form.setAttribute("aria-label", "Leave a comment");
        form.tabIndex = 0;
        form.style.position = "relative";
        form.method = "POST";
        form.name = "post-comment";
        const formtitle = document.createElement("h3");
        formtitle.innerHTML = "Leave a comment";

        // Thank Div
        const thanks = document.createElement("div");
        thanks.classList.add("thank-div");

        // Name input
        const nameInput = document.createElement("input");
        nameInput.setAttribute("type", "text");
        nameInput.name = "user-name";
        nameInput.setAttribute("required", "true");
        nameInput.setAttribute("placeholder", "Your name");

        // User Rating Section
        const rating = document.createElement("div");
        let hidden = document.createElement("input");
        hidden.id = "user-rating";
        hidden.type = "hidden";
        hidden.name = "user-rating";
        rating.id = 'ratingCont';
        rating.innerHTML = "<span style='vertical-align:0.25em'>Rating </span>";
        rating.append(hidden);

        // Comment Input
        const comment = document.createElement("textarea");
        comment.setAttribute("type", "text");
        comment.setAttribute("required", "true");
        comment.name = "user-comment";
        comment.setAttribute("aria-label", "What would you like to say?");
        comment.setAttribute("placeholder", "What would you like to say?");

        // Submit Btn
        const submit = document.createElement("a");
        submit.setAttribute("role", "button");
        submit.style.cursor = "pointer";
        submit.tabIndex = 0;
        submit.addEventListener("keydown", function (e) {
            if (e.keyCode == 13 || e.keyCode == 32) {
                e.preventDefault();
                this.click();
            }
        })
        submit.onclick = (e) => {
            // form.submit();
            // console.log(document.forms);
            let error;
            [].slice.apply(document.forms[0]).reverse().forEach(e => {
                if (!e.value) {
                    error = 1;
                    if (e.name != "user-rating") {
                        e.focus();
                    } else {
                        let ele = document.querySelector("#ratingCont > div");
                        ele.focus();
                    }
                    return;
                }
            });
            if (error) return;
            let body = {
                "restaurant_id": self.restaurant.id,
                "name": document.forms[0]["user-name"].value,
                "rating": document.forms[0]["user-rating"].value,
                "comments": document.forms[0]["user-comment"].value
            };
            if (!navigator.onLine && (navigator.serviceWorker && navigator.serviceWorker.controller.state === "activated")) {
                navigator.serviceWorker.ready.then(e => {
                    return db.set(body, db.toBe).then(() => {
                        e.sync.register("post-comment").then(x => {
                            let thanks = document.querySelector(".thank-div");
                            thanks.innerText = "Your comment will be posted as soon as you are online.";
                            thanks.classList.toggle("show");
                            setTimeout(() => { thanks.classList.toggle("show"); }, 3000);
                            [].slice.apply(document.forms[0]).forEach(e => e.value = "");

                        }).catch(err => {
                            alert("An error has occured.");
                            console.error(err);
                        });
                    }).catch(e => {
                        alert("An error has occured.");
                        console.error(e);
                        return 0;
                    });
                })
            } else {
                fetch(`http://${location.hostname}:1337/reviews/`, {
                    method: "POST",
                    body: JSON.stringify(body)
                }).then((e) => {
                    return e.json();
                }).then(e => {
                    const ul = document.getElementById('reviews-list');
                    // console.log(e); return;
                    [].slice.apply(document.forms[0]).forEach(e => e.value = "");
                    ul.appendChild(createReviewHTML(e));
                    let thanks = document.querySelector(".thank-div");
                    thanks.innerText = "Thank You";
                    thanks.classList.toggle("show");
                    setTimeout(() => { thanks.classList.toggle("show"); }, 3000);
                }).catch(e=>console.error(e));
            }
        }
        submit.classList.add("submit-btn");
        submit.innerHTML = "Submit";

        // Getting all the pieces together
        form.appendChild(formtitle);
        form.appendChild(thanks);
        form.appendChild(nameInput);
        form.append(rating);
        form.appendChild(comment);
        form.innerHTML += "<br>";
        form.appendChild(submit);

        if (!reviews) {
            const noReviews = document.createElement('p');
            container.setAttribute("aria-label", "Reviews. No reviews yet!");
            noReviews.innerHTML = 'No reviews yet!';
            container.appendChild(noReviews);
            container.appendChild(form);
            initRatings();
            return;
        }
        const ul = document.getElementById('reviews-list');
        reviews.forEach(review => {
            ul.appendChild(createReviewHTML(review));
        });
        container.appendChild(ul);
        container.appendChild(form);
        initRatings();
    }

    /**
     * Create review HTML and add it to the webpage.
        innerDiv.appendChild(poop.ele);
     */
    createReviewHTML = (review) => {
        const li = document.createElement('li');
        const divs = [document.createElement('div'), document.createElement('div')];
        const name = document.createElement('p');
        const dividor = document.createElement("div");
        dividor.className = "dividor";
        name.innerHTML = review.name;
        divs[0].appendChild(name);
        const date = document.createElement('p');
        date.innerHTML = new Date(review.createdAt).toLocaleString();
        divs[0].appendChild(date);

        const rating = document.createElement('p');
        rating.innerHTML = `Rating: ${review.rating}`;
        divs[1].appendChild(rating);
        li.appendChild(divs[0]);
        li.appendChild(divs[1]);
        li.appendChild(dividor);
        const comments = document.createElement('p');
        comments.innerHTML = review.comments;
        li.appendChild(comments);

        return li;
    }

    function initRatings() {
        let element = document.getElementById("ratingCont");
        let hidden = document.getElementById("user-rating");
        let ratingSelect = new RatingSelection(hidden);
        element.append(ratingSelect.ele);
    }

    /**
     * Add restaurant name to the breadcrumb navigation menu
     */
    fillBreadcrumb = (restaurant = self.restaurant) => {
        const breadcrumb = document.getElementById('breadcrumb');
        const favoriteDiv = document.getElementById("favorite-btn");
        favoriteDiv.id = "favorite-btn";
        const li = document.createElement('li');
        li.innerHTML = restaurant.name;
        breadcrumb.appendChild(li);
        breadcrumb.appendChild(favoriteDiv);
    }

    /**
     * Get a parameter by name from page URL.
     */
    getParameterByName = (name, url) => {
        if (!url)
            url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
            results = regex.exec(url);
        if (!results)
            return null;
        if (!results[2])
            return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }
    window.init();
}