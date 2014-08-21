// The first parameter is a list of points defining the polygon's vertices.
// Supply each point as an object with properties 'x' and 'y'.
// The color is optional (default black).
// Despite the name, you can render *some* concave polygons with this class
// as long as it can be rendered as a triangle fan (start 'points' with the
// pivotal vertex of the fan).
function ConvexPolygon(points, color)
{
    this.hidden = false;

    this.points = points;

    this.color = color || 'black';

    if (!(this.color instanceof jQuery.Color))
        this.color = jQuery.Color(this.color);

    // Set up vertices
    var vertexCoords = [];
    for (var i = 0; i < points.length; ++i)
    {
        vertexCoords.push(points[i].x);
        vertexCoords.push(points[i].y);
    }

    this.vertices = {};
    this.vertices.data = new Float32Array(vertexCoords);

    this.vertices.bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices.bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices.data, gl.STATIC_DRAW);
}

// Convenience constructor for arrows (i.e. this returns a new
// ConvexPolygon, with vertices set up as necessary).
// Length is the distance from start to tip of the arrow.
// Width is measured at the widest part of the arrow.
// Origin is where the arrow starts (not where it points to).
// Direction is an arbitrary 2D vector (does not need to be
// normalised).
// The arrow is not actually a convex polygon, but is rendered correctly
// by the ConvexPolygon class anyway, because the tip of the arrow is
// listed first.
ConvexPolygon.CreateArrow = function(length, width, origin, direction, color)
{
    // Get normalised direction
    var d = sqrt(direction.x*direction.x + direction.y*direction.y);
    var dx = direction.x / d;
    var dy = direction.y / d;

    // Get normal perpendicular to direction
    var nx = -dy;
    var ny = dx;

    // Set up vertices. Note that the tip has to be listed first.
    var vertices = [
        {
            x: origin.x + dx * length,
            y: origin.y + dy * length
        },
        {
            x: origin.x + dx * length/2 + nx * width/2,
            y: origin.y + dy * length/2 + ny * width/2
        },
        {
            x: origin.x + dx * length/2 + nx * width/4,
            y: origin.y + dy * length/2 + ny * width/4
        },
        {
            x: origin.x + nx * width/4,
            y: origin.y + ny * width/4
        },
        {
            x: origin.x - nx * width/4,
            y: origin.y - ny * width/4
        },
        {
            x: origin.x + dx * length/2 - nx * width/4,
            y: origin.y + dy * length/2 - ny * width/4
        },
        {
            x: origin.x + dx * length/2 - nx * width/2,
            y: origin.y + dy * length/2 - ny * width/2
        },
    ];

    return new ConvexPolygon(vertices, color);
};

// Convenience constructor for pentagrams (i.e. this returns a new
// ConvexPolygon, with vertices set up as necessary).
// Length is the length of each of the ten edges.
// Tip is vertex on the vertical axis.
// Inverted is a boolean which will mirror the pentagram on the 
// horizontal through the tip.
// The pentagram is not actually a convex polygon, but its interior
// is rendered correctly by the ConvexPolygon class anyway, because 
// its center is listed as the first vertex.
ConvexPolygon.CreatePentagram = function(length, tip, inverted, color)
{
    // Get inner and outer radius 
    // (see http://mathworld.wolfram.com/Pentagram.html)
    var r = phi * phi * length * sqrt((25-11*sqrt(5))/10);
    var R = phi * phi * length * sqrt((5-sqrt(5))/10);

    // Get origin
    var x = tip.x;
    var y = inverted ? tip.y + R : tip.y - R;

    var vertices = [];

    var angle = inverted ? pi/2 : -pi/2;

    for (var i = 0; i <= 10; ++i, angle += pi/5)
        vertices.push({
            x: x + cos(angle) * (i%2 ? R : r),
            y: y + sin(angle) * (i%2 ? R : r)
        });

    return new ConvexPolygon(vertices, color);
};



// Convenience constructor for rhombs (i.e. this returns a new
// ConvexPolygon, with vertices set up as necessary).
// Length is the length of each edge.
// Tip is one reference vertex.
// Direction is an integer in the range [0,4] which determines
// the axis that connects the tip to the opposite vertex.
ConvexPolygon.CreateRhomb = function(length, tip, direction, color)
{
    var axis = direction * 2 * pi / 5;

    // Half of the acute angle
    var halfAngle = pi / 5;

    vertices = [
        {
            x: tip.x,
            y: tip.y
        },
        {
            x: tip.x + length * cos(axis - halfAngle),
            y: tip.y + length * sin(axis - halfAngle)
        },
        {
            x: tip.x + phi * length * cos(axis),
            y: tip.y + phi * length * sin(axis)
        },
        {
            x: tip.x + length * cos(axis + halfAngle),
            y: tip.y + length * sin(axis + halfAngle)
        },
    ];

    return new ConvexPolygon(vertices, color);
};

// Convenience constructor for golden triangles rhombs (i.e. 
// this returns a new ConvexPolygon, with vertices set up as 
// necessary).
// Length is the length of each edge.
// Tip is one reference vertex.
// Direction is an integer in the range [0,4] which determines
// the axis that connects the tip to the opposite vertex.
ConvexPolygon.CreateTriangle = function(length, tip, direction, color)
{
    var axis = direction * 2 * pi / 5;

    // Half of the acute angle
    var acuteAngle = pi / 5;

    vertices = [
        {
            x: tip.x,
            y: tip.y
        },
        {
            x: tip.x + phi * length * cos(axis),
            y: tip.y + phi * length * sin(axis)
        },
        {
            x: tip.x + length * cos(axis + acuteAngle),
            y: tip.y + length * sin(axis + acuteAngle)
        },
    ];

    return new ConvexPolygon(vertices, color);
};

// Convenience constructor for THAT octagon (i.e. 
// this returns a new ConvexPolygon, with vertices set up as 
// necessary).
// Length is the length of each edge.
// Nudge is one concave reference vertex.
// Direction is an integer in the range [0,4] which determines
// the axis that connects the tip to the opposite vertex.
ConvexPolygon.CreateOctagon = function(length, nudge, direction, color)
{
    var axis = direction * 2 * pi / 5;

    // Half of the acute angle
    var halfAngle = pi / 5;

    var angle = axis - 3*halfAngle;

    vertices = [
        {
            x: x = nudge.x,
            y: y = nudge.y
        },
        {
            x: x += length * cos(angle),
            y: y += length * sin(angle)
        },
        {
            x: x += length * cos(angle += 2*halfAngle),
            y: y += length * sin(angle)
        },
        {
            x: x += length * cos(angle += 2*halfAngle),
            y: y += length * sin(angle)
        },
        {
            x: x += length * cos(angle += 2*halfAngle),
            y: y += length * sin(angle)
        },
        {
            x: x += length * cos(angle -= halfAngle),
            y: y += length * sin(angle)
        },
        {
            x: x += length * cos(angle += 2*halfAngle),
            y: y += length * sin(angle)
        },
        {
            x: x += length * cos(angle += 2*halfAngle),
            y: y += length * sin(angle)
        },
    ];

    return new ConvexPolygon(vertices, color);
};



ConvexPolygon.prototype.hide = function() { this.hidden = true; };
ConvexPolygon.prototype.show = function() { this.hidden = false; };

// Outline can optionally be set to true to render ... well ...
// only an outline.
// An optional color can overwrite the default (the color provided
// in the constructor for solid rendering and black for outlines).
ConvexPolygon.prototype.render = function(outline, color) {
    if (this.hidden) return;

    gl.useProgram(shaderProgram.program);

    gl.uniform2f(shaderProgram.uCenter, 0, 0);
    gl.uniform1f(shaderProgram.uScale, 1);
    gl.uniform1f(shaderProgram.uAngle, 0);

    gl.enableVertexAttribArray(shaderProgram.aPos);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices.bufferId);
    gl.vertexAttribPointer(shaderProgram.aPos, 2, gl.FLOAT, false, 0, 0);

    if (outline)
        color = color || 'black';
    else
        color = color || this.color;

    if (!(color instanceof jQuery.Color))
        color = jQuery.Color(color);

    gl.uniform4f(shaderProgram.uColor,
                 color.red()/255,
                 color.green()/255,
                 color.blue()/255,
                 1);

    if (outline)
        gl.drawArrays(gl.LINE_LOOP, 0, this.points.length);
    else
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.points.length);

    gl.disableVertexAttribArray(shaderProgram.aPos);
};

// "Destructor" - this has to be called manually
ConvexPolygon.prototype.destroy = function() {
    gl.deleteBuffer(this.vertices.bufferId);
    delete this.vertices;
};