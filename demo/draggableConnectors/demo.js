;
(function () {

    var listDiv = document.getElementById("list"),

        showConnectionInfo = function (s) {
            listDiv.innerHTML = s;
            listDiv.style.display = "block";
        },
        hideConnectionInfo = function () {
            listDiv.style.display = "none";
        },
        connections = [],
        updateConnections = function (conn, remove) {
            if (!remove) connections.push(conn);//connections记录已经连过的线
            else {//如果被移除了，相应位置为-1，再从数组移除
                var idx = -1;
                for (var i = 0; i < connections.length; i++) {
                    if (connections[i].connection == conn.connection) {
                        idx = i;
                        break;
                    }
                }
                if (idx != -1) connections.splice(idx, 1);
            }
            if (connections.length > 0) {//数组中记录了已连接的线不为空，更新表格信息
                var s = "<span><strong>Connections</strong></span><br/><br/><table><tr><th>Scope</th><th>Source</th><th>Target</th></tr>";
                for (var j = 0; j < connections.length; j++) {
                    s = s + "<tr><td>" + connections[j].connection.scope + "</td>" + "<td>" + connections[j].connection.sourceId +'.' + connections[j].sourceEndpoint.id.match(/_(\S*)_/)[1] + "</td><td>" + connections[j].connection.targetId+ '.' + connections[j].targetEndpoint.id.match(/_(\S*)_/)[1] + "</td></tr>";
                }
                showConnectionInfo(s);
            } else
                hideConnectionInfo();
        };

    jsPlumb.ready(function () {

        var instance = jsPlumb.getInstance({
            DragOptions: { cursor: 'pointer', zIndex: 2000 },
            PaintStyle: { stroke: '#666' },
            EndpointHoverStyle: { fill: "orange" },
            HoverPaintStyle: { stroke: "orange" },
            EndpointStyle: { width: 20, height: 16, stroke: '#666' },
            Endpoint: "Rectangle",
            Anchors: ["TopCenter", "TopCenter"],
            Container: "canvas"
        });

        // suspend drawing and initialise.
        instance.batch(function () {
            instance.bind("beforeDrop", function (params) {
                return confirm("Connect " + params.sourceId + " to " + params.targetId + "?");
            })
            // bind to connection/connectionDetached events, and update the list of connections on screen.
            instance.bind("connection", function (info, originalEvent) {
                // updateConnections(info.connection);
                updateConnections(info); 
            });
            // bind click listener; delete connections on click
            instance.bind("click", function (conn) {
                instance.deleteConnection(conn); // 原来叫detach，后来改名了，垃圾库
            });
            //bind to mouseup connect done before
            instance.bind("beforeDetach", function (conn) {
                        return confirm("Delete connection?");
            });
            instance.bind("connectionDetached", function (info, originalEvent) {
                // updateConnections(info.connection, true);
                updateConnections(info, true);
            });
            instance.bind("connectionMoved", function (info, originalEvent) {
                //  only remove here, because a 'connection' event is also fired.
                // in a future release of jsplumb this extra connection event will not
                // be fired.
                // updateConnections(info.connection, true);
                updateConnections(info, true);
            });

            // configure some drop options for use by all endpoints.
            var exampleDropOptions = {
                tolerance: "touch",
                hoverClass: "dropHover",
                activeClass: "dragActive"
            };

            //
            // first example endpoint.  it's a 25x21 rectangle (the size is provided in the 'style' arg to the Endpoint),
            // and it's both a source and target.  the 'scope' of this Endpoint is 'exampleConnection', meaning any connection
            // starting from this Endpoint is of type 'exampleConnection' and can only be dropped on an Endpoint target
            // that declares 'exampleEndpoint' as its drop scope, and also that
            // only 'exampleConnection' types can be dropped here.
            //
            // the connection style for this endpoint is a Bezier curve (we didn't provide one, so we use the default), with a strokeWidth of
            // 5 pixels, and a gradient.
            //
            // there is a 'beforeDrop' interceptor on this endpoint which is used to allow the user to decide whether
            // or not to allow a particular connection to be established.
            //
            var exampleColor = "#00f";
            var exampleEndpoint1 = {
                endpoint: "Rectangle",
                paintStyle: { width: 25, height: 21, fill: exampleColor },
                isSource: true,
                // reattach: true,
                scope: "Blue",
                connectorStyle: {
                    gradient: {stops: [
                        [0, exampleColor],
                        [0.5, "#09098e"],
                        [1, exampleColor]
                    ]},
                    strokeWidth: 5,
                    stroke: exampleColor,
                    dashstyle: "2 2"
                },
                maxConnections: 3,
                isTarget: true,
                dropOptions: exampleDropOptions
            };

            //
            // the second example uses a Dot of radius 15 as the endpoint marker, is both a source and target,
            // and has scope 'exampleConnection2'.
            //
            var color2 = "#316b31";
            var exampleEndpoint2 = {
                endpoint: ["Dot", { radius: 11 }],
                paintStyle: { fill: color2 },
                isSource: true,
                scope: "Green",
                connectorStyle: { stroke: color2, strokeWidth: 6 },
                connector: ["Bezier", { curviness: 63 } ],
                maxConnections: 3, //不能detach
                isTarget: true,
                dropOptions: exampleDropOptions
            };

            //
            // the third example uses a Dot of radius 17 as the endpoint marker, is both a source and target, and has scope
            // 'exampleConnection3'.  it uses a Straight connector, and the Anchor is created here (bottom left corner) and never
            // overriden, so it appears in the same place on every element.
            //
            // this example also demonstrates the beforeDetach interceptor, which allows you to intercept
            // a connection detach and decide whether or not you wish to allow it to proceed.
            //
            var example3Color = "rgba(229,219,61,0.5)";
            var exampleEndpoint3 = {
                endpoint: ["Dot", {radius: 15} ],
                // anchor: "BottomLeft",
                paintStyle: { fill: example3Color, opacity: 0.5 },
                isSource: true,
                scope: 'Yellow',
                connectorStyle: {
                    stroke: example3Color,
                    strokeWidth: 4
                },
                connector: ["Bezier", { curviness: 63 } ], // "Straight"
                maxConnections: 3,
                isTarget: true,
                dropOptions: exampleDropOptions,
                onMaxConnections: function (info) {
                    alert("Cannot drop connection " + info.connection.id + " : maxConnections has been reached on Endpoint " + info.endpoint.id);
                }
            };

            // setup some empty endpoints.  again note the use of the three-arg method to reuse all the parameters except the location
            // of the anchor (purely because we want to move the anchor around here; you could set it one time and forget about it though.)
            // var e1 = instance.addEndpoint('dragDropWindow1', { anchor: [0.5, 1, 0, 1] }, exampleEndpoint2);

            // setup some DynamicAnchors for use with the blue endpoints
            // and a function to set as the maxConnections callback.
            // var anchors = [
            //         [1, 0.2, 1, 0],
            //         [0.8, 1, 0, 1],
            //         [0, 0.8, -1, 0],
            //         [0.2, 0, 0, -1]
            //     ],
            var maxConnectionsCallback = function (info) {
                    alert("Cannot drop connection " + info.connection.id + " : maxConnections has been reached on Endpoint " + info.endpoint.id);
                };

            var i = 0;
            var e1 = instance.my_addEndpoint("dragDropWindow1", { anchor: [0, 0.1, -1, 0] }, exampleEndpoint1, i++);
            // you can bind for a maxConnections callback using a standard bind call, but you can also supply 'onMaxConnections' in an Endpoint definition - see exampleEndpoint3 above.
            e1.bind("maxConnections", maxConnectionsCallback);
            instance.my_addEndpoint("dragDropWindow1", { anchor: [1, 0.7, 1, 0] }, exampleEndpoint1, i++);
            instance.my_addEndpoint("dragDropWindow1", { anchor: [1, 0.9, 1, 0] }, exampleEndpoint3, i++);

            i = 0;
            var e2 = instance.my_addEndpoint('dragDropWindow2', { anchor: [0, 0.1, -1, 0] }, exampleEndpoint2, i++);
            // again we bind manually. it's starting to get tedious.  but now that i've done one of the blue endpoints this way, i have to do them all...
            e2.bind("maxConnections", maxConnectionsCallback);
            instance.my_addEndpoint("dragDropWindow2", { anchor: [0, 0.3, -1, 0] }, exampleEndpoint1, i++);
            instance.my_addEndpoint("dragDropWindow2", { anchor: [1, 0.9, 1, 0] }, exampleEndpoint1, i++);
            
            i = 0;
            var e3 = instance.my_addEndpoint("dragDropWindow3", { anchor: [0, 0.1, -1, 0] }, exampleEndpoint3, i++);
            e3.bind("maxConnections", maxConnectionsCallback);
            instance.my_addEndpoint("dragDropWindow3", { anchor: [0, 0.3, -1, 0] }, exampleEndpoint1, i++);
            instance.my_addEndpoint("dragDropWindow3", { anchor: [1, 0.7, 1, 0] }, exampleEndpoint1, i++);
            instance.my_addEndpoint("dragDropWindow3", { anchor: [1, 0.9, 1, 0] }, exampleEndpoint2, i++);

            i = 0;
            var e4 = instance.my_addEndpoint("dragDropWindow4", { anchor: [0, 0.1, -1, 0] }, exampleEndpoint1, i++);
            e4.bind("maxConnections", maxConnectionsCallback);
            instance.my_addEndpoint("dragDropWindow4", { anchor: [0, 0.3, -1, 0] }, exampleEndpoint2, i++);
            instance.my_addEndpoint("dragDropWindow4", { anchor: [1, 0.5, 1, 0] }, exampleEndpoint1, i++);
            instance.my_addEndpoint("dragDropWindow4", { anchor: [1, 0.7, 1, 0] }, exampleEndpoint2, i++);
            instance.my_addEndpoint("dragDropWindow4", { anchor: [1, 0.9, 1, 0] }, exampleEndpoint3, i++);

            // make .window divs draggable
            instance.draggable(jsPlumb.getSelector(".drag-drop-demo .window"));

            // add endpoint of type 3 using a selector.
            //////////////////////////////////////////////////////////////////////////////////////
            // instance.addEndpoint(jsPlumb.getSelector(".drag-drop-demo .window"), exampleEndpoint3);

            var hideLinks = jsPlumb.getSelector(".drag-drop-demo .hide");
            instance.on(hideLinks, "click", function (e) {
                instance.toggleVisible(this.getAttribute("rel"));
                jsPlumbUtil.consume(e);
            });

            var dragLinks = jsPlumb.getSelector(".drag-drop-demo .drag");
            instance.on(dragLinks, "click", function (e) {
                var s = instance.toggleDraggable(this.getAttribute("rel"));
                this.innerHTML = (s ? 'disable dragging' : 'enable dragging');
                jsPlumbUtil.consume(e);
            });

            var detachLinks = jsPlumb.getSelector(".drag-drop-demo .detach");
            instance.on(detachLinks, "click", function (e) {
                instance.detachAllConnections(this.getAttribute("rel"));
                jsPlumbUtil.consume(e);
            });

            instance.on(document.getElementById("clear"), "click", function (e) {
                instance.detachEveryConnection();
                showConnectionInfo("");
                jsPlumbUtil.consume(e);
            });
        });

        jsPlumb.fire("jsPlumbDemoLoaded", instance);

    });
})();