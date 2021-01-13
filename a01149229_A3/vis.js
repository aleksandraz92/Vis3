d3.csv("urbana_crimes.csv", function (data) {


    var margin = {top: 5, right: 10, bottom: 25, left: 40},
        width = 750 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom,
        smallHeight = 250- margin.top - margin.bottom,
        widthWithMargins = 750,
        heightWithMargins = 450,
        smallHeightWithMargins = 250
    ;



    var svg = d3.select("#charts").append("svg")
        .attr("height", heightWithMargins)
        .attr("width", widthWithMargins);



    var div = d3.select("#charts").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);


    // https://www.quora.com/What-are-the-latitude-and-longitude-of-the-U-S-A  Variable which gives us Longitude and Latitude for USA
    var longitudeAmericaR = -124.75;
    var longitudeAmericaL = -66.95;
    var latitudeAmericaT = 25.84;
    var latitudeAmericaB = 49.38;

    // Urbana Longitude and Latitude from .csv file
    var UrbanaLatitude = 40.10;
    var UrbanaLongitude = -88.21;

    //Scaling
    var longitudeScale = d3.scaleLinear()
        .domain([longitudeAmericaR, longitudeAmericaL])
        .range([0, width]);

    var latitudeScale = d3.scaleLinear()
        .domain([latitudeAmericaB, latitudeAmericaT])
        .range([0, height]);


    var allData = [];
    var n = 0;

    data.forEach((element) => {
        var mappedArresteeHomeCity = element['ARRESTEE HOME CITY - MAPPED'];
        if (mappedArresteeHomeCity != null) {
            var coordinatesAsString = mappedArresteeHomeCity.substr(mappedArresteeHomeCity.indexOf('(') + 1).slice(0, -1);
            var coordinates = coordinatesAsString.split(/,/);
            var coordinatesAsFloats = [];

            coordinates.forEach((el) => {


                // coordinatesAsFloats.push(parseFloat(el));
                coordinatesAsFloats.push(el.trim());
            });


            //in Range so it can display?
            if ((coordinatesAsFloats[0] > latitudeAmericaT && coordinatesAsFloats[0] < latitudeAmericaB) || (coordinatesAsFloats[1] > longitudeAmericaL && coordinatesAsFloats[1] < longitudeAmericaR) && !isNaN(coordinatesAsFloats[0]) && !isNaN(coordinatesAsFloats[1])) {
                allData[n] = {latitude:coordinatesAsFloats[0],
                    longitude:coordinatesAsFloats[1],
                    gender:element['ARRESTEE SEX'],
                    name:element['ARRESTEE HOME CITY'],
                    year:element['YEAR OF ARREST'],
                    dateOfArrest:element['DATE OF ARREST']
                };

                n++;
            }
        }

    });

// quelle https://stackoverflow.com/questions/14446511/what-is-the-most-efficient-method-to-groupby-on-a-javascript-array-of-objects
    var groupElements = function(first, key) {
        return first.reduce(function(second, value) {
            (second[value[key]] = second[value[key]] || []).push(value);
            return second;
        }, {});
    };

    var groupedData = groupElements(allData, 'name');

    // sumarize duplicated data
    allDataAggregated = [];


    var i = 0;
    for (var property in groupedData) {
        if (groupedData.hasOwnProperty(property)) {
            var cityArrayList = groupedData[property];

            var maleCount = 0,femaleCount = 0;
            for(var j = 0;j<cityArrayList.length;j++) {
                if(cityArrayList[j].gender==='MALE'){
                    ++maleCount;
                }else if(cityArrayList[j].gender==='FEMALE'){
                    ++femaleCount;
                }
            }

            allDataAggregated[i] = {
                name: cityArrayList[0].name,
                latitude: cityArrayList[0].latitude,
                longitude: cityArrayList[0].longitude,
                totalArreestes:cityArrayList.length,
                maleArreestes:maleCount,
                femaleArreestes:femaleCount
            };
            i++;
        }
    }


    var arresteesPerYear = [];
    var groupDataByYear = groupElements(allData, 'year');

    i=0;
    for (var property in groupDataByYear) {
        if (groupDataByYear.hasOwnProperty(property)) {
            var arrayElement = groupDataByYear[property]
            arresteesPerYear[i] = {year:arrayElement[0].year,value:arrayElement.length};
            ++i;
        }
    }



    // *******************************************
    var brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("start brush end", brushmoved);

    var gBrush = svg.append("g")
        .attr("class", "brush")
        .call(brush);

    var handle = gBrush.selectAll(".handle--custom")
        .data([{type: "w"}, {type: "e"}])
        .enter().append("path")
        .attr("class", "handle--custom")
        .attr("fill", "#666")
        .attr("fill-opacity", 0.8)
        .attr("stroke", "#000")
        .attr("stroke-width", 1.5)
    ;

    svg.selectAll("line")
        .data(allDataAggregated)
        .enter()
        .append("line")
        .attr("x1", longitudeScale(UrbanaLongitude))

        .attr("y1", latitudeScale(UrbanaLatitude))

        .attr("x2", function (d) {
            return longitudeScale(d.longitude);
        })
        .attr("y2", function (d) {
            return latitudeScale(d.latitude);
        })
        .style("stroke", function (d) {
            if(d.totalArreestes>3){
                return "red";
            }else if(d.totalArreestes>1){
                return "black";
            }else{
                return "steelblue";
            }
        })
        // .style("stroke", "steelblue")
        .style("stroke-width", 0.4)
        .on("mouseover", function (d) {
            highlightLine(this, d, false);
        })
        .on("mouseout", function (d) {
            highlightLine(this, d, true);
        });


    var modal = document.getElementById('myModal');
    var cityNameInPopup = document.getElementById('cityName');
    var span = document.getElementsByClassName("close")[0];
    span.onclick = function() {
        modal.style.display = "none";
    }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }


    var circle = svg.selectAll("circle")
        .data(allDataAggregated)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            return longitudeScale(d.longitude);
        })
        .attr("cy", function (d) {
            return latitudeScale(d.latitude);
        })
        .attr("r", 1)
        .style("fill", function (d) {
            if(d.totalArreestes>3){
                return "red";
            }else if(d.totalArreestes>1){
                return "black";
            }else{
                return "steelblue";
            }
        })

        //// quelle : http://bl.ocks.org/d3noob/a22c42db65eb00d4e369 mouseover
        .on("mouseover", function (d) {
            highlightOutline(this, false);
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(d.name + "<br/>")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
            highlightOutline(this, true);
            div.transition()
                .duration(500)
                .style("opacity", 0)
        })
        .on("click", function (d) {
            modal.style.display = "block";
            cityNameInPopup.innerHTML = d.name;
            var button = document.getElementById("showInfoBtn");
            button.onclick = function() {
                window.open("./table.html?name="+d.name+"&total="+d.totalArreestes+"&maleCount="+d.maleArreestes+"&femaleCount="+d.femaleArreestes,
                    '_blank',
                    'toolbar=0,location=0,menubar=0');
            }
        });


    function brushmoved() {
        var s = d3.event.selection;


        if (s == null) {
            handle.attr("display", "none");
            // stroke: #f00;
            circle.style("fill", function (d) {
                if(d.totalArreestes>3){
                    return "red";
                }else if(d.totalArreestes>1){
                    return "black";
                }else{
                    return "steelblue";
                }
            }).style("stroke-opacity",0.0);
        } else {
            var x0 = s[0][0],
                y0 = s[0][1],
                x1 = s[1][0],
                y1 = s[1][1];
            circle.style("stroke-opacity",function(d){
                if(longitudeScale(d.longitude)>=x0 && longitudeScale(d.longitude)<=x1 &&
                    latitudeScale(d.latitude)>=y0 && latitudeScale(d.latitude)<=y1)
                    return 1.0;
                else{
                    return 0.0;
                }
            }).
            style("stroke","green").
            style("stroke-width", "10px");
        }
    }


    var xAxis = d3.axisBottom();
    xAxis.scale(longitudeScale);
    var xAxisGroup = svg.append("g")
        .call(xAxis);


    var yAxis = d3.axisRight();
    yAxis.scale(latitudeScale);
    var yAxisGroup = svg.append("g")
        .call(yAxis);

    function highlightOutline(thisElement, isMouseOut) {
        d3.select(thisElement).style("stroke-opacity", isMouseOut ? 0.0 : 1.0);
        d3.select(thisElement).style("stroke", "green");
        d3.select(thisElement).style("stroke-width", "10px");

    }

    function highlightLine(thisElement, d, isMouseOut) {
        var color;
        if(d.totalArreestes>3){
            color = "red";
        }else if(d.totalArreestes>1){
            color = "black";
        }else{
            color = "steelblue";
        }

        d3.select(thisElement).style("stroke", isMouseOut ? color : 'green');
        d3.select(thisElement).style("stroke-width", isMouseOut ? 0.4 : '5px');

    }

    /*

     HISTOGRAM

    */

    var svg2 = d3.select("#charts")
        .append("svg")
        .attr("width", widthWithMargins)
        .attr("height", heightWithMargins);

    var areesteesPerYearMax = d3.max(arresteesPerYear, d => { return d.value });

    var domain = [0,areesteesPerYearMax];

    var barScale = d3.scaleLinear()
        .domain(domain)
        .range([0, height]);

    var x = d3.scaleBand().rangeRound([0, width]).padding(0.025);
    var y = d3.scaleLinear().rangeRound([height, 0]);

    var g = svg2.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(arresteesPerYear.map(function(d) { return d.year; }));
    y.domain(domain);

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y))
        .append("text");

    g.selectAll(".bar")
        .data(arresteesPerYear)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .style("fill","steel-blue")
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d.value); })
        .attr("x", function(d) { return x(d.year); })
        .attr("y", function(d) { return y(d.value); })


//***************************************2nd Histogram - TimeLine histogram*/

    var svg4 = d3.select("#charts")
        .append("svg")
        .attr("width", widthWithMargins)
        .attr("height", smallHeightWithMargins);


    // Parse the date / time
    var parseYearMonth = d3.timeParse("%Y");

    var timelineData = [];
    arresteesPerYear.forEach((d,i)=>{
        timelineData[i] = {date:parseYearMonth(d.year),value:d.value}
    });


    var tenYearFromNow = new Date();
    tenYearFromNow.setFullYear(tenYearFromNow.getFullYear() + 10);

    var hundredYearsAgo = new Date();
    hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);

    var xDates=[hundredYearsAgo,tenYearFromNow];

    var x3 = d3.scaleTime()
        .range([0, width])
        
        .domain(d3.extent(xDates, e => {return e}));

    var y3 = d3.scaleLinear().rangeRound([smallHeight, 0]);


    var x3Axis = d3.axisBottom(x3);
    var y3Axis = d3.axisRight(y3);




    y3.domain([0, d3.max(timelineData, d => { return d.value; })]);

    svg4.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + smallHeight + ")")
        .call(x3Axis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-45)" );

    svg4.append("g")
        .attr("class", "y axis")
        .call(y3Axis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end");

    svg4.selectAll("bar")
        .data(timelineData)
        .enter().append("rect")
        .style("fill", "silver")
        .attr("x", function(d) { return x3(d.date); })
        .attr("width", x.bandwidth()-10)
        .attr("y", function(d) { return y3(d.value); })
        .attr("height", function(d) { return smallHeight - y3(d.value); });






// scaterplot*******************************************************************************

    var svg3 = d3.select("#charts")
        .append("svg")
        .attr("width", widthWithMargins)
        .attr("height", smallHeightWithMargins);

    var scatterplotData = [];
    allData.forEach((d, i) => {
        scatterplotData[i] = {
            date:d.dateOfArrest,
            distanceInKm: getDistanceFromLatLonInKm(UrbanaLatitude, UrbanaLongitude, d.latitude, d.longitude)
        }

    });

//https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
    function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2-lat1);  // deg2rad below
        var dLon = deg2rad(lon2-lon1);

        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2));
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c; // Distance in km
        return d;
    }

    function deg2rad(deg) {
        return deg * (Math.PI/180)
    }

    var parseDate = d3.timeParse("%d/%m/%Y");
    scatterplotData.forEach( d => {
        d.date = parseDate(d.date);
    })


    var x2 = d3.scaleTime()
        .range([0, width])
        // extent Returns the minimum and maximum value in the given array using natural order
        .domain(d3.extent(scatterplotData, d => {return d.date}));

    var y2 = d3.scaleLinear()
        .range([smallHeight, 0])
        .domain([0, d3.max(scatterplotData, d => {return d.distanceInKm} )])
    ;

    var xAxis2 = d3.axisBottom(x2);
    var yAxis2 = d3.axisLeft(y2);

    var plot = svg3.append("g")
        .attr("class", "plot")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    plot.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + smallHeight + ")") // omjeranje dole x ose
        .call(xAxis2);

    plot.append("g")
        .attr("class", "axis y-axis")

        .call(yAxis2);

//  scatter plot
    var dots = plot.append("g");
    dots.selectAll("dot")
        .data(scatterplotData)
        .enter()
        .append("circle")
        .attr('class', 'dot')
        .attr("r",1.5)
        
        .style("fill", "silver")
        .attr("cx", function(d) { return x2(d.date); })
        .attr("cy", function(d) { return y2(d.distanceInKm); })

    ;




})











