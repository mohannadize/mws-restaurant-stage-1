const starIcon = '<svg version="1.1" class="Capa_1" width="1.5em" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-5 -6 55 55" xml:space="preserve">   <path class="star-icon" d="M26.285,2.486l5.407,10.956c0.376,0.762,1.103,1.29,1.944,1.412l12.091,1.757       c2.118,0.308,2.963,2.91,1.431,4.403l-8.749,8.528c-0.608,0.593-0.886,1.448-0.742,2.285l2.065,12.042       c0.362,2.109-1.852,3.717-3.746,2.722l-10.814-5.685c-0.752-0.395-1.651-0.395-2.403,0l-10.814,5.685       c-1.894,0.996-4.108-0.613-3.746-2.722l2.065-12.042c0.144-0.837-0.134-1.692-0.742-2.285l-8.749-8.528       c-1.532-1.494-0.687-4.096,1.431-4.403l12.091-1.757c0.841-0.122,1.568-0.65,1.944-1.412l5.407-10.956       C22.602,0.567,25.338,0.567,26.285,2.486z"/>   </svg>';
// document.addEventListener("click",(e)=>console.log(e.target));
class RatingSelection {
    constructor(target_input) {
        this.ele = document.createElement("div");
        if (target_input) this.target_input = target_input;
        this.rating = null;
        // if (target_input) this.ele.append(this.target_input);
        this.ele.setAttribute("role", "radiogroup");
        this.ele.setAttribute("aria-label", "Your Rating");
        this.ele.addEventListener("keydown", (e) => {
            (e.keyCode == 39 || e.keyCode == 37) ? e.preventDefault() : 0;
            if (this.rating == null) {
                this.rating = 1;
            } else {
                if (e.keyCode === 39) {
                    if (this.rating < 5) this.rating++;
                } else if (e.keyCode === 37) {
                    if (this.rating > 1) this.rating--;
                }
            }
            this.refresh();
        })
        this.stars = [];
        this.ele.tabIndex = 0;
        this.ele.style.display = "inline-block";
        for (let i = 0; i < 5; i++) {
            let star = document.createElement("a");
            star.innerHTML = starIcon;
            star.setAttribute("data-rating", i + 1)
            star.style.cursor = "pointer";
            star.style.padding = "0.25em";
            this.stars.push(star);
            this.ele.appendChild(star);
            star.addEventListener("mouseenter", (ele) => {
                this.stars.forEach((e) => {
                    if (e.dataset.rating <= ele.currentTarget.dataset.rating) {
                        e.children[0].children[0].style["fill"] = "orange";
                    } else {
                        e.children[0].children[0].style["fill"] = "transparent";
                    }
                })
            })
            star.addEventListener("mouseleave", () => this.refresh());
            star.onclick = (e) => {
                this.rating = e.currentTarget.dataset.rating;
                this.refresh();
            }
        }
        // return this.ele;
    }
    refresh() {
        if (!this.rating) {
            this.stars.forEach((e) => {
                e.children[0].children[0].style["fill"] = "transparent";
            })
        } else {
            this.ele.setAttribute("aria-valuenow", this.rating + ((this.rating == 1) ? " star" : " stars"));
            if (this.target_input) this.target_input.value = this.rating;
            this.stars.forEach((e) => {
                if (e.dataset.rating <= this.rating) {
                    e.children[0].children[0].style["fill"] = "orange";
                } else {
                    e.children[0].children[0].style["fill"] = "transparent";
                }
            })
        }
    }
}
if (location.pathname.search("restaurant.html") === -1) {
    let restaurants,
        neighborhoods,
        cuisines;
    var map;
    var markers = [];

    /**
     * Fetch neighborhoods and cuisines as soon as the page is loaded.
     */
    document.addEventListener('DOMContentLoaded', (event) => {
        fetchNeighborhoods();
        fetchCuisines();
    });

    /**
     * Fetch all neighborhoods and set their HTML.
     */
    fetchNeighborhoods = () => {
        DBHelper.fetchNeighborhoods((error, neighborhoods) => {
            if (error) { // Got an error
                console.error(error);
            } else {
                self.neighborhoods = neighborhoods;
                fillNeighborhoodsHTML();
            }
        });
    }

    /**
     * Set neighborhoods HTML.
     */
    fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
        const select = document.getElementById('neighborhoods-select');
        neighborhoods.forEach(neighborhood => {
            const option = document.createElement('option');
            option.innerHTML = neighborhood;
            option.value = neighborhood;
            select.append(option);
        });
    }

    /**
     * Fetch all cuisines and set their HTML.
     */
    fetchCuisines = () => {
        DBHelper.fetchCuisines((error, cuisines) => {
            if (error) { // Got an error!
                console.error(error);
            } else {
                self.cuisines = cuisines;
                fillCuisinesHTML();
            }
        });
    }

    /**
     * Set cuisines HTML.
     */
    fillCuisinesHTML = (cuisines = self.cuisines) => {
        const select = document.getElementById('cuisines-select');

        cuisines.forEach(cuisine => {
            const option = document.createElement('option');
            option.innerHTML = cuisine;
            option.value = cuisine;
            select.append(option);
        });
    }

    /**
     * Initialize Google map, called from HTML.
     */
    window.initMap = () => {
        // let loc = {
        //     lat: 40.722216,
        //     lng: -73.987501
        // };
        // self.map = new google.maps.Map(document.getElementById('map'), {
        //     zoom: 12,
        //     center: loc,
        //     scrollwheel: false
        // });
        // google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
        //     setTimeout(disableTabindex, 2000);
        // })
        // function disableTabindex() {
        //     [].slice.apply(document.querySelectorAll(`#map-container *`)).map(x => {
        //         x.setAttribute("tabindex", -1);
        //     })
        // }
        updateRestaurants();
    }
    /**
     * Update page and map for current restaurants.
     */
    updateRestaurants = () => {
        const cSelect = document.getElementById('cuisines-select');
        const nSelect = document.getElementById('neighborhoods-select');

        const cIndex = cSelect.selectedIndex;
        const nIndex = nSelect.selectedIndex;

        const cuisine = cSelect[cIndex].value;
        const neighborhood = nSelect[nIndex].value;

        DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
            if (error) { // Got an error!
                console.error(error);
            } else {
                resetRestaurants(restaurants);
                fillRestaurantsHTML();
            }
        })
    }

    /**
     * Clear current restaurants, their HTML and remove their map markers.
     */
    resetRestaurants = (restaurants) => {
        // Remove all restaurants
        self.restaurants = [];
        const ul = document.getElementById('restaurants-list');
        ul.innerHTML = '';

        // Remove all map markers
        self.markers.forEach(m => m.setMap(null));
        self.markers = [];
        self.restaurants = restaurants;
    }

    /**
     * Create all restaurants HTML and add them to the webpage.
     */
    fillRestaurantsHTML = (restaurants = self.restaurants) => {
        const ul = document.getElementById('restaurants-list');
        restaurants.forEach(restaurant => {
            ul.append(createRestaurantHTML(restaurant));
        });
        var lazy = new LazyLoad({
            elements_selector: ".restaurant-img"
        });
    }

    /**
     * Create restaurant HTML.
     */
    createRestaurantHTML = (restaurant) => {
        const li = document.createElement('li');
        if (restaurant.is_favorite) li.classList.add("favorite");
        const details = document.createElement("div");
        const article = document.createElement("article");
        const favorite = document.createElement("a");
        favorite.classList.add("fav-btn");
        favorite.innerHTML = starIcon;
        favorite.href = "javascript:void(0)";
        favorite.setAttribute("aria-label", `Favorite ${restaurant.name} restaurant.`)
        favorite.setAttribute("role", "button");
        favorite.onclick = (e) => {
            e.currentTarget.parentNode.parentNode.classList.toggle("favorite");
            DBHelper.favorite(restaurant.id);
            document.activeElement.blur();
        }
        favorite.addEventListener("keydown", function (e) {
            if (e.keyCode == 13 || e.keyCode == 32) {
                e.preventDefault();
                this.click();
            }
        })
        details.className = "details";
        const image = document.createElement('img');
        image.className = 'restaurant-img';
        image.setAttribute('alt', `${restaurant.name} restaurant.`);
        const images = DBHelper.imageUrlForRestaurant(restaurant);
        image.dataset.srcset = (`${images[1]} 600w, ${images[0]} 1200w`);
        image.dataset.src = ("data-src", images[0]);
        const name = document.createElement('h3');
        name.innerHTML = restaurant.name;
        details.append(name);

        const neighborhood = document.createElement('p');
        neighborhood.innerHTML = restaurant.neighborhood;
        details.append(neighborhood);

        const address = document.createElement('p');
        address.innerHTML = restaurant.address;
        details.append(address);
        const more = document.createElement('a');
        more.classList.add("details-btn");
        more.innerHTML = 'View Details';
        more.setAttribute("aria-label", `More details about ${restaurant.name} restaurant`);
        more.href = DBHelper.urlForRestaurant(restaurant);
        details.append(more);
        article.append(image);
        article.append(details);
        article.append(favorite);
        li.append(article);

        return li;
    }


    updateRestaurants();
}
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register("sw.js", { scope: './' });
}
(function () {
    const body = document.querySelector("body");
    let pooopop = document.createElement("a");
    pooopop.innerText = "Test";
    pooopop.onclick = () => {
        console.log("Button is fkn working");
        navigator.serviceWorker.ready.then(e => {
            console.log("1");
            return e.sync.register("poop");
        }).then(e => {
            console.log("Sync Reg")
        }).catch(e => 
            console.error(e)
        );
        console.log("last");
    }
    body.append(pooopop);
})()
// const body = "poop";
// 