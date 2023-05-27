function currentDate() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getQueryParameter(name) {
    const url = window.location.href;
    const queryString = url.substring(url.indexOf('?') + 1);
    const parameters = queryString.split('&');

    for (var i = 0; i < parameters.length; i++) {
        const parameter = parameters[i].split('=');
        const paramName = decodeURIComponent(parameter[0]);
        if (paramName == name) return decodeURIComponent(parameter[1]);
    }
    return null;
}

function toNumber(value, defaultValue) {
    try {
        return Number.parseFloat(value);
    } catch (e) {
        return defaultValue;
    }
}

function dom(el, html) {
    let element = document.createElement(el);
    element.innerHTML = html;
    return element;
}

async function loadItems() {
    const response = await fetch("latest-canonical.json")
    const items = await response.json();

    for (item of items) {
        item.search = item.name + " " + item.unit;
        item.search = item.search.toLowerCase().replace(",", ".");

        item.numPrices = item.priceHistory.length;
        item.priceOldest = item.priceHistory[item.priceHistory.length - 1].price;
        item.dateOldest = item.priceHistory[item.priceHistory.length - 1].date;
        item.date = item.priceHistory[0].date;
        let highestPriceBefore = -1;
        for (let i = 1; i < item.priceHistory.length; i++) {
            const price = item.priceHistory[i];
            highestPriceBefore = Math.max(highestPriceBefore, price.price);
        }
        if (highestPriceBefore == -1) highestPriceBefore = item.price;
        item.highestBefore = highestPriceBefore;
    }
    return items;
}

let carts = [];
loadCarts();

function loadCarts() {
    let val = localStorage.getItem("carts");
    carts = val ? JSON.parse(val) : [];
}

function saveCarts() {
    localStorage.setItem("carts", JSON.stringify(carts, null, 2));
}

function hasCart(name) {
    for (cart of carts) {
        if (cart.name = name) return true;
    }
    return false;
}

function addCart(name) {
    carts.push({
        name: name,
        items: []
    });
    saveCarts();
}

function removeCart(name) {
    carts = carts.filter(cart => cart.name != name);
    saveCarts();
}

function itemToStoreLink(item) {
    if (item.store == "spar")
        return `<a target="_blank" href="https://www.interspar.at/shop/lebensmittel/search/?q=${encodeURIComponent(item.name)}">${item.name}</a>`;
    if (item.store == "billa")
        return `<a target="_blank" href="https://shop.billa.at/search/results?category=&searchTerm=${encodeURIComponent(item.name)}">${item.name}</a>`;
    if (item.store == "hofer")
        return `<a target="_blank" href="https://www.roksh.at/hofer/angebot/suche/${encodeURIComponent(item.name)}">${item.name}</a>`;
    if (item.store == "dm")
        return `<a target="_blank" href="https://www.dm.at/product-p${item.id}.html">${item.name}</a>`;
    if (item.store == "lidl")
        return `<a target="_blank" href="https://www.lidl.at${item.url}">${item.name}</a>`;
    if (item.store == "mpreis")
        return `<a target="_blank" href="https://www.mpreis.at/shop/p/${item.id}">${item.name}</a>`;
    return item.name;
}

function itemToDOM(item) {
    let storeDom = dom("td", item.store);
    storeDom.setAttribute("data-label", "Kette");
    let nameDom = dom("td", `<div class="itemname">${itemToStoreLink(item)}</div>`);
    nameDom.setAttribute("data-label", "Name");
    let unitDom = dom("td", item.unit ? item.unit : "");
    unitDom.setAttribute("data-label", "Menge");
    let increase = "";
    if (item.priceHistory.length > 1) {
        let percentageChange = Math.round((item.priceHistory[0].price - item.priceHistory[1].price) / item.priceHistory[1].price * 100);
        increase = `<span class="${percentageChange > 0 ? "increase" : "decrease"}">${(percentageChange > 0 ? "+" + percentageChange : percentageChange)}%</span>`;
    }
    let priceDomText = `${Number(item.price).toFixed(2)} ${increase} ${item.priceHistory.length > 1 ? "(" + (item.priceHistory.length - 1) + ")" : ""}`;
    let pricesText = "";
    for (let i = 0; i < item.priceHistory.length; i++) {
        const date = item.priceHistory[i].date;
        const currPrice = item.priceHistory[i].price;
        const lastPrice = item.priceHistory[i + 1] ? item.priceHistory[i + 1].price : currPrice;
        const increase = Math.round((currPrice - lastPrice) / lastPrice * 100);
        let priceColor = "black";
        if (increase > 0) priceColor = "red";
        if (increase < 0) priceColor = "green";
        pricesText += `<span style="color: ${priceColor}">${date} ${currPrice} ${increase > 0 ? "+" + increase : increase}%</span>`;
        if (i != item.priceHistory.length - 1) pricesText += "<br>";
    }
    let priceDom = dom("td", `${priceDomText}<div class="priceinfo hide">${pricesText}</div>`);
    priceDom.setAttribute("data-label", "Preis");
    if (item.priceHistory.length > 1) {
        priceDom.style["cursor"] = "pointer";
        priceDom.addEventListener("click", () => {
            const pricesDom = priceDom.querySelector(".priceinfo");
            if (pricesDom.classList.contains("hide")) {
                pricesDom.classList.remove("hide");
            } else {
                pricesDom.classList.add("hide");
            }
        });
    }
    let row = dom("tr", "");
    switch (item.store) {
        case "billa":
            row.style["background"] = "rgb(255 255 225)";
            break;
        case "spar":
            row.style["background"] = "rgb(225 244 225)";
            break;
        case "hofer":
            row.style["background"] = "rgb(230 230 255)";
            break;
        case "dm":
            row.style["background"] = "rgb(255 240 230)";
            break;
        case "lidl":
            row.style["background"] = "rgb(255 225 225)";
            break;
        case "mpreis":
            row.style["background"] = "rgb(255 230 230)";
    }
    row.appendChild(storeDom);
    row.appendChild(nameDom);
    row.appendChild(unitDom);
    row.appendChild(priceDom);
    return row;
}

let componentId = 0;

function searchItems(items, query, billa, spar, hofer, dm, lidl, mpreis, eigenmarken, minPrice, maxPrice, exact, bio) {
    query = query.trim();
    if (query.length < 3) return [];

    if (query.charAt(0) == "!") {
        query = query.substring(1);
        return alasql("select * from ? where " + query, [items]);
    }

    const tokens = query.split(/\s+/).map(token => token.toLowerCase().replace(",", "."));

    let hits = [];
    for (item of items) {
        let allFound = true;
        for (token of tokens) {
            if (token.length == 0) continue;
            const index = item.search.indexOf(token);
            if (index < 0) {
                allFound = false;
                break;
            }
            if (exact) {
                if (index > 0 && (item.search.charAt(index - 1) != " " && item.search.charAt(index - 1) != "-")) {
                    allFound = false;
                    break;
                }
                if (index + token.length < item.search.length && item.search.charAt(index + token.length) != " ") {
                    allFound = false;
                    break;
                }
            }
        }
        if (allFound) {
            const name = item.name.toLowerCase();
            if (item.store == "billa" && !billa) continue;
            if (item.store == "spar" && !spar) continue;
            if (item.store == "hofer" && !hofer) continue;
            if (item.store == "dm" && !dm) continue;
            if (item.store == "lidl" && !lidl) continue;
            if (item.store == "mpreis" && !mpreis) continue;
            if (item.price < minPrice) continue;
            if (item.price > maxPrice) continue;
            if (eigenmarken && !(name.indexOf("clever") == 0 || name.indexOf("s-budget") == 0 || name.indexOf("milfina") == 0)) continue;
            if (bio && !item.bio) continue;
            hits.push(item);
        }
    }
    return hits;
}

function newSearchComponent(parentElement, items, searched, filter, headerModifier, itemDomModifier) {
    let id = componentId++;
    parentElement.innerHTML = "";
    parentElement.innerHTML = `
        <input id="search-${id}" class="search" type="text" placeholder="Produkte suchen...">
        <a id="querylink-${id}" class="hide">Query link</a>
        <div class="filters">
            <label><input id="billa-${id}" type="checkbox" checked="true"> Billa</label>
            <label><input id="spar-${id}" type="checkbox" checked="true"> Spar</label>
            <label><input id="hofer-${id}" type="checkbox" checked="true"> Hofer</label>
            <label><input id="dm-${id}" type="checkbox" checked="true"> DM</label>
            <label><input id="lidl-${id}" type="checkbox" checked="true"> Lidl</label>
            <label><input id="mpreis-${id}" type="checkbox" checked="false"> MPREIS</label>
        </div>
        <div class="filters">
            <label><input id="eigenmarken-${id}" type="checkbox"> Nur CLEVER / S-BUDGET / MILFINA</label>
            <label><input id="bio-${id}" type="checkbox"> Nur Bio</label>
        </div>
        <div class="filters">
            <label>Min € <input id="minprice-${id}" type="number" min="0" value="0"></label>
            <label>Max € <input id="maxprice-${id}" type="number" min="0" value="100"></label>
            <label><input id="exact-${id}" type="checkbox"> Exaktes Wort</label>
        </div>
        <div id="numresults-${id}"></div>
        <table id="result-${id}" class="searchresults"></table>
    `;

    const searchInput = parentElement.querySelector(`#search-${id}`);
    const queryLink = parentElement.querySelector(`#querylink-${id}`);
    const exact = parentElement.querySelector(`#exact-${id}`);
    const table = parentElement.querySelector(`#result-${id}`);
    const eigenmarken = parentElement.querySelector(`#eigenmarken-${id}`);
    const bio = parentElement.querySelector(`#bio-${id}`);
    const billa = parentElement.querySelector(`#billa-${id}`);
    const spar = parentElement.querySelector(`#spar-${id}`);
    const hofer = parentElement.querySelector(`#hofer-${id}`);
    const dm = parentElement.querySelector(`#dm-${id}`);
    const lidl = parentElement.querySelector(`#lidl-${id}`);
    const mpreis = parentElement.querySelector(`#mpreis-${id}`);
    const minPrice = parentElement.querySelector(`#minprice-${id}`);
    const maxPrice = parentElement.querySelector(`#maxprice-${id}`);
    const numResults = parentElement.querySelector(`#numresults-${id}`);

    let search = (query) => {
        let hits = [];
        let now = performance.now();
        try {
            hits = searchItems(items, query,
                billa.checked, spar.checked, hofer.checked, dm.checked, lidl.checked, mpreis.checked,
                eigenmarken.checked, toNumber(minPrice.value, 0), toNumber(maxPrice.value, 100), exact.checked, bio.checked
            );
        } catch (e) {
            console.log("Query: " + query + "\n" + e.message);
        }
        console.log("Search took " + (performance.now() - now) / 1000.0 + " secs");
        if (searched) hits = searched(hits);
        if (filter) hits = hits.filter(filter);
        table.innerHTML = "";
        if (hits.length == 0) {
            numResults.innerHTML = "Resultate: 0";
            return;
        }
        if (query.trim().charAt(0) != "!") hits.sort((a, b) => a.price - b.price);

        let header = dom("tr", `<th>Kette</th><th>Name</th><th>Menge</th><th>Preis</th>`);
        if (headerModifier) header = headerModifier(header);
        const thead = dom("thead", ``);
        thead.appendChild(header);
        table.appendChild(thead);

        now = performance.now();
        let num = 0;
        hits.every(hit => {
            let itemDom = itemToDOM(hit);
            if (itemDomModifier) itemDom = itemDomModifier(hit, itemDom, hits);
            table.appendChild(itemDom);
            num++;
            return num < 500;
        });
        console.log("Building DOM took: " + (performance.now() - now) / 1000.0 + " secs");
        numResults.innerHTML = "Resultate: " + hits.length + (num < hits.length ? ", " + num + " angezeigt" : "");
    }

    searchInput.addEventListener("input", (event) => {
        const query = searchInput.value.trim();
        if (query == 0) {
            minPrice.value = 0;
            maxPrice.value = 100;
        }
        if (query.length > 0 && query.charAt(0) == "!") {
            parentElement.querySelectorAll(".filters").forEach(f => f.style.display = "none");
            queryLink.classList.remove("hide");
            queryLink.setAttribute("href", "/?q=" + encodeURIComponent(query));
        } else {
            parentElement.querySelectorAll(".filters").forEach(f => f.style.display = "block");
            queryLink.classList.add("hide");
        }
        search(searchInput.value);
    });
    eigenmarken.addEventListener("change", () => search(searchInput.value));
    bio.addEventListener("change", () => search(searchInput.value));
    billa.addEventListener("change", () => search(searchInput.value));
    spar.addEventListener("change", () => search(searchInput.value));
    hofer.addEventListener("change", () => search(searchInput.value));
    dm.addEventListener("change", () => search(searchInput.value));
    lidl.addEventListener("change", () => search(searchInput.value));
    mpreis.addEventListener("change", () => search(searchInput.value));
    exact.addEventListener("change", () => search(searchInput.value));
    minPrice.addEventListener("change", () => search(searchInput.value));
    maxPrice.addEventListener("change", () => search(searchInput.value));

    return () => search(searchInput.value);
}

function showChart(canvasDom, items) {
    if (items.length == 0) {
        canvasDom.style.display = "none";
        return;
    } else {
        canvasDom.style.display = "block";
    }

    const allDates = items.flatMap(product => product.priceHistory.map(item => item.date));
    const uniqueDates = [...new Set(allDates)];
    uniqueDates.sort();

    const datasets = items.map(product => {
        let price = null;
        const prices = uniqueDates.map(date => {
            const priceObj = product.priceHistory.find(item => item.date === date);
            if (!price && priceObj) price = priceObj.price;
            return priceObj ? priceObj.price : null;
        });

        for (let i = 0; i < prices.length; i++) {
            if (prices[i] == null) {
                prices[i] = price;
            } else {
                price = prices[i];
            }
        }

        return {
            label: product.name,
            data: prices,
        };
    });

    const ctx = canvasDom.getContext('2d');
    if (canvasDom.lastChart) canvasDom.lastChart.destroy();
    canvasDom.lastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: uniqueDates,
            datasets: datasets
        },
        options: {
            responsive: true,
            aspectRation: 16 / 9,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: "EURO"
                    }
                }
            }
        }
    });
}

function calculateOverallPriceChanges(items) {
    if (items.length == 0) return { dates: [], changes: [] };
    const allDates = items.flatMap(product => product.priceHistory.map(item => item.date));
    const uniqueDates = [...new Set(allDates)];
    uniqueDates.sort();

    const allPrices = items.map(product => {
        let price = null;
        const prices = uniqueDates.map(date => {
            const priceObj = product.priceHistory.find(item => item.date === date);
            if (!price && priceObj) price = priceObj.price;
            return priceObj ? priceObj.price : null;
        });

        for (let i = 0; i < prices.length; i++) {
            if (!prices[i]) {
                prices[i] = price;
            } else {
                price = prices[i];
            }
        }
        return prices;
    });

    const priceChanges = [];
    for (let i = 0; i < uniqueDates.length; i++) {
        let price = 0;
        for (let j = 0; j < allPrices.length; j++) {
            price += allPrices[j][i];
        }
        priceChanges.push({ date: uniqueDates[i], price });
    }

    return priceChanges;
}