// Facebook SDK

// Initialize the Facebook SDK
window.fbAsyncInit = function () {
    FB.init({
        appId: '341827359241906', // App ID
        channelUrl: 'channel.html', // Path to your Channel File
        status: true, // check login status
        cookie: true, // enable cookies to allow the server to access the session
        xfbml: true  // parse XFBML
});

// Listen for and handle auth.statusChange events
FB.Event.subscribe('auth.statusChange', function(response) {
    if (response.authResponse) {
        // On login...
        FB.api('/me', function(me) {
            if (me.name) {
                // Display user name
                document.getElementById('auth-displayname').innerHTML = me.name;
                // Retrieve friends API object
                FB.api('/me/friends', getFriends);
            }
        })
        document.getElementById('auth-loggedout').style.display = 'none';
        document.getElementById('auth-loggedin').style.display = 'block';
    } else {
        // User has not authorized your app or isn't logged in
        document.getElementById('auth-loggedout').style.display = 'block';
        document.getElementById('auth-loggedin').style.display = 'none';
    }
    });
        
    // Respond to clicks on login and logout links
    document.getElementById('auth-loginlink').addEventListener('click', function() {
        FB.login();
    });
    document.getElementById('auth-logoutlink').addEventListener('click', function(){
        FB.logout();
    });
}

function indexWithAttribute(array, attr, value) {
    // Iterates over an array and returns the index of the element
    // whose attribute matches the given value, or -1 if not found. 
    for(var i=0; i < array.length; i++) {
        if(array[i][attr] === value) {
            return i;
        } else {
            return -1;
        }
    }
}

function showName(d) {
    // Displays given d3 node's 'name' attribute.
    document.getElementById('selected-friend-name').innerHTML = d['name'];
}

function getMutualFriends(id, friends, friendlinks) {
    // Retrieves a Facebook API object containing mutual friends
    // for a given user ID. Passes it to the getLinks() function.
    FB.api('/me/mutualfriends/' + id, function (response) {
        getLinks(response, id, friends, friendlinks); }
    );
}

function getLinks(response, id, friends, friendlinks) {
    // Calculates links between mutual friends and pushes them to an array.
    // Displays percent of friend links completed in 'load-status' div. 
    var mutualFriends = response['data'];
    var sourceIndex = indexWithAttribute(friends, 'id', id);

    var completed = Math.round(100*(sourceIndex/friends.length));

    document.getElementById('load-status').innerHTML = 'Calculating mutual friend links: ' + completed + '%'    
    for (i=0; i< mutualFriends.length; i++) {
            friends[sourceIndex]['value'] = mutualFriends.length;
            targetIndex = indexWithAttribute(friends, 'id', mutualFriends[i]['id']);
            friendlinks.push({'source':sourceIndex, 
                              'target':targetIndex,
                              'value':mutualFriends.length });
    }       

    if (sourceIndex === friends.length - 1) { 
        graphFriends(friends, friendlinks); }        
}
        
function getFriends(response) {
    // Loads friend nodes as an array. Creates array to hold links between mutual friends.
    var friends = response['data']
    var friendlinks = []
     
    for (i=0; i < friends.length; i++) {
        var id = friends[i]['id'];
        getMutualFriends(id, friends, friendlinks);
    }
}

function graphFriends(friends, friendlinks) {
    // Configures a d3 force-directed graph of friends and friend links.
    document.getElementById('load-status').innerHTML = ''
    
    // Set dimensions of svg
    var width = window.innerWidth - 100,
        height = window.innerHeight - 100;
    
    // Set up a 10-color scale for node colors
    var color = d3.scale.category10()
    
    // Set up a linear scale to map number of mutual
    // friends to node radius
    var r = d3.scale.linear()
                .domain([1,100])
                .range([5,15])
    
    // Set the initial parameters of the force() layout
    var force = d3.layout.force()
        .charge(-75)
        .linkDistance(40)
        .size([width / 1.2, height / 2])
    
    // Add svg and start visualization
    var svg = d3.select("#viz").append("svg")
        .attr("width", width)
        .attr("height", height);
    
    // Pass in friends array as graph nodes and friendlinks
    // array as graph edges.
    force.nodes(friends)
        .links(friendlinks)
        .start();
     
    var link = svg.selectAll("line.link")
        .data(friendlinks)
      .enter().append("line")
        .attr("class", "link")
        .style("stroke", "#eee")
        .style("stroke-width", 1);
        
    var node = svg.selectAll("circle.node")
        .data(friends)
      .enter().append("circle")
        .attr("class", "node")
        .attr("r", function(d) { return r(d.value); })
        .style("stroke", "#eee")
        .style("fill", function(d) { return color(d.value); })
        .on("mouseover", function(d) { showName(d); })
        .call(force.drag);

    force.on("tick", function() {
       link.attr("x1", function(d) { return d.source.x; })
           .attr("y1", function(d) { return d.source.y; })
           .attr("x2", function(d) { return d.target.x; })
           .attr("y2", function(d) { return d.target.y; });
 
       node.attr("cx", function(d) { return d.x; })
           .attr("cy", function(d) { return d.y; });
     });
}

console.log("Hello");