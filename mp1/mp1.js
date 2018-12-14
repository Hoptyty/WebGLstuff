var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;
var vertexColorBuffer;

var deg = 0;
var rotAngle = 0;
var rotAngle2 = 0;
var mode = 1;

var mvMatrix = mat4.create();

/* convert degrees to radians */
function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

/*get canvas created inside .html file*/
function createGLContext(canvas) {
	var names = ["webgl", "experimental-webgl"];
	var context = null;
	for (var i = 0; i < names.length; i++) {
		try {
			context = canvas.getContext(names[i]);
		} catch(e) {}
		if (context) {
			break;
		}
	}
	if (context) {
		context.viewportWidth = canvas. width;
		context.viewportHeight = canvas.height;
	} else {
		alert("Failed to create WebGL context!");
	}
	return context;
}

/*---------------------------------------------------------*/
/*Loading the vertex and fragment shader code from mp1.html*/

function loadShaderFromDOM(id) {
	var shaderScript = document.getElementById(id);
	if (!shaderScript) {
		return null;
	}
	var shaderSource = "";
	var currentChild = shaderScript.firstChild;
	while (currentChild) {
		if (currentChild.nodeType == 3) {
			shaderSource += currentChild.textContent;
		}
		currentChild = currentChild.nextSibling;
	}
	var shader;
	if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;
	}
	gl.shaderSource(shader, shaderSource);
	gl.compileShader(shader);
	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(shader));
		return null;
	}
	return shader;
}


/*setting up the vertex and fragment shader*/
function setupShaders() {
	vertexShader = loadShaderFromDOM("shader-vs");
	fragmentShader = loadShaderFromDOM("shader-fs");
	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Failed to setup shaders");
	}
	gl.useProgram(shaderProgram);
	shaderProgram.vertexPositionAttribute =gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram,  "aVertexColor");
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

/*setting up the vertex position buffers and the vertex color buffers*/
function setupBuffers() {
	vertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
	var triangleVertices  = [	
		-0.9  , 0.95, 0.0,
		-0.9  , 0.6 , 0.0,
		-0.75, 0.6 , 0.0,

		-0.9  , 0.95, 0.0,
		-0.75, 0.6  , 0.0,
		-0.33, 0.6  , 0.0,

		-0.9  , 0.95, 0.0,
		-0.33, 0.6	 , 0.0,
		  0.0    , 0.95, 0.0,

		  0.0    , 0.95, 0.0,
		-0.33, 0.6	 , 0.0,
		  0.33, 0.6	 , 0.0,

		  0.0    , 0.95, 0.0,
		  0.33, 0.6	 , 0.0,
		  0.9  , 0.95, 0.0,

		 0.9  , 0.95, 0.0,
		 0.75, 0.6	 , 0.0,
		 0.33, 0.6	 , 0.0,

		  0.9  , 0.95, 0.0,
		  0.9  , 0.6	 , 0.0,
		  0.75, 0.6	 , 0.0,		

		  -0.75, 0.6   , 0.0,
		  -0.75, -0.3, 0.0,
		  -0.33, -0.3, 0.0,

		  -0.75, 0.6     , 0.0,
		  -0.33, -0.3  , 0.0,
		  -0.33, -0.05, 0.0, 

		  -0.75, 0.6     , 0.0,
		  -0.33, -0.3  , 0.0,
		  -0.33, 0.35 , 0.0,

		  -0.75, 0.6     , 0.0,
		  -0.33, 0.35 , 0.0,
		  -0.33, 0.6      , 0.0,

		  -0.33, 0.35, 0.0,
		  -0.18   , 0.35, 0.0,
		  -0.18   , -0.05, 0.0,

		  -0.33, 0.35, 0.0,
		  -0.18    , -0.05, 0.0,
		  -0.33, -0.05, 0.0,		

		  0.75, 0.6   , 0.0,
		  0.75, -0.3, 0.0,
		  0.33, -0.3, 0.0,

		  0.75, 0.6     , 0.0,
		  0.33, -0.3  , 0.0,
		  0.33, -0.05, 0.0, 

		  0.75, 0.6     , 0.0,
		  0.33, -0.3  , 0.0,
		  0.33, 0.35 , 0.0,

		  0.75, 0.6     , 0.0,
		  0.33, 0.35 , 0.0,
		  0.33, 0.6      , 0.0,

		  0.33, 0.35, 0.0,
		  0.18   , 0.35, 0.0,
		  0.18   , -0.05, 0.0,

		  0.33, 0.35, 0.0,
		  0.18    , -0.05, 0.0,
		  0.33, -0.05, 0.0,		

		 -0.75, -0.35, 0.0,
		 -0.75, -0.5  , 0.0,
		 -0.6 ,  -0.6 , 0.0,

		 -0.75, -0.35, 0.0,
		 -0.6  ,  -0.6 , 0.0,
		 -0.6  ,  -0.35 , 0.0,

		 -0.48, -0.35, 0.0,
		 -0.48, -0.68, 0.0,
		 -0.33, -0.78, 0.0,

		 -0.48, -0.35, 0.0,
		 -0.33, -0.78, 0.0,
		 -0.33, -0.35, 0.0,

		 -0.21, -0.35, 0.0,
		 -0.21, -0.86, 0.0,
		 -0.06, -0.96, 0.0,

		 -0.21,  -0.35, 0.0,
		 -0.06, -0.96, 0.0,
		 -0.06, -0.35, 0.0,

		 0.75, -0.35, 0.0,
		 0.75, -0.5  , 0.0,
		 0.6 ,  -0.6 , 0.0,

		 0.75, -0.35, 0.0,
		 0.6 ,  -0.6 , 0.0,
		 0.6 ,  -0.35 , 0.0,

		 0.48, -0.35, 0.0,
		 0.48, -0.68, 0.0,
		 0.33, -0.78, 0.0,

		 0.48, -0.35, 0.0,
		 0.33, -0.78, 0.0,
		 0.33, -0.35, 0.0,

		 0.21, -0.35, 0.0,
		 0.21, -0.86, 0.0,
		 0.06, -0.96, 0.0,

		 0.21,  -0.35, 0.0,
		 0.06, -0.96, 0.0,
		 0.06, -0.35, 0.0			
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
	vertexPositionBuffer.itemSize = 3;
	vertexPositionBuffer.numberOfItems = 93;

	vertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
	var colors = [
		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.075, 0.12, 0.2, 1.0, //blue
		0.075, 0.12, 0.2, 1.0,
		0.075, 0.12, 0.2, 1.0,

		0.98, 0.39, 0.0, 1.0,  //orange
		0.98, 0.39, 0.0, 1.0,
		0.98, 0.39, 0.0, 1.0,

		0.98, 0.39, 0.0, 1.0,  //orange
		0.98, 0.39, 0.0, 1.0,
		0.98, 0.39, 0.0, 1.0,

		0.98, 0.39, 0.0, 1.0,  //orange
		0.98, 0.39, 0.0, 1.0,
		0.98, 0.39, 0.0, 1.0,

		0.98, 0.39, 0.0, 1.0,  //orange
		0.98, 0.39, 0.0, 1.0,
		0.98, 0.39, 0.0, 1.0,

		0.98, 0.39, 0.0, 1.0,  //orange
		0.98, 0.39, 0.0, 1.0,
		0.98, 0.39, 0.0, 1.0,

		0.98, 0.39, 0.0, 1.0,  //orange
		0.98, 0.39, 0.0, 1.0,
		0.98, 0.39, 0.0, 1.0,

		0.98, 0.39, 0.0, 1.0,  //orange
		0.98, 0.39, 0.0, 1.0,
		0.98, 0.39, 0.0, 1.0,

		0.98, 0.39, 0.0, 1.0,  //orange
		0.98, 0.39, 0.0, 1.0,
		0.98, 0.39, 0.0, 1.0,

		0.98, 0.39, 0.0, 1.0,  //orange
		0.98, 0.39, 0.0, 1.0,
		0.98, 0.39, 0.0, 1.0,

		0.98, 0.39, 0.0, 1.0,  //orange
		0.98, 0.39, 0.0, 1.0,
		0.98, 0.39, 0.0, 1.0,

		0.98, 0.39, 0.0, 1.0,  //orange
		0.98, 0.39, 0.0, 1.0,
		0.98, 0.39, 0.0, 1.0,

		0.98, 0.39, 0.0, 1.0,  //orange
		0.98, 0.39, 0.0, 1.0,
		0.98, 0.39, 0.0, 1.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	vertexColorBuffer.itemSize = 4;
	vertexColorBuffer.numItems = 93;
}

/* draw function that draws the colored triangles from the vertex position buffer and vertex color buffers*/
function draw() {
	var transfromVec = vec3.create();
	var scaleVec = vec3.create();
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT);

	mat4.identity(mvMatrix);
	vec3.set(transfromVec, 0,Math.sin(deg)*0.3,0);			//translate matrix
	mat4.translate(mvMatrix, mvMatrix, transfromVec)		//move the badge up and down
	vec3.set(scaleVec, 0.5,0.5* (75-Math.abs(rotAngle2)/2)/60 ,0); 	//scale matrix
	mat4.rotateZ(mvMatrix, mvMatrix, degToRad(rotAngle));	//rotate 
	mat4.scale(mvMatrix, mvMatrix, scaleVec);				//squash and squeeze y-axis

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0,0);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
	gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

/* startup function that loads the canvas, shaders and buffers*/
/* And it starts the animation by calling tick() function*/
function startup() {
 	canvas = document.getElementById("myGLCanvas");
 	gl = createGLContext(canvas);
 	setupShaders(); 
 	setupBuffers();
 	gl.clearColor(1.0, 1.0, 1.0, 1.0);	//white background
 	gl.enable(gl.DEPTH_TEST);
 	tick();
}

/* animation function that updates each frame to create animation effect*/
function animate() {
	if(Math.abs(rotAngle2) > 30) {
		mode = -1 * mode;
	}
	rotAngle = rotAngle +  0.3;
	rotAngle2 = rotAngle2 + mode * 0.3;	//set rotAngle2 keep changing between -30 to 30
	deg += 0.03;
	 var triangleVertices  = [	//Non-affine transformation
		-0.9  , 0.95, 0.0,
		-0.9  , 0.6 , 0.0,
		-0.75, 0.6	 , 0.0,

		-0.9  , 0.95, 0.0,
		-0.75, 0.6	 , 0.0,
		-0.33, 0.6	 , 0.0,

		-0.9  , 0.95, 0.0,
		-0.33, 0.6	 , 0.0,
		  0.0    , 0.95, 0.0,

		  0.0    , 0.95, 0.0,
		-0.33, 0.6	 , 0.0,
		  0.33, 0.6	 , 0.0,

		  0.0    , 0.95, 0.0,
		  0.33, 0.6	 , 0.0,
		  0.9  , 0.95, 0.0,

		 0.9  , 0.95, 0.0,
		 0.75, 0.6	 , 0.0,
		 0.33, 0.6	 , 0.0,

		  0.9  , 0.95, 0.0,
		  0.9  , 0.6	 , 0.0,
		  0.75, 0.6	 , 0.0,		//top

		  -0.75, 0.6   , 0.0,
		  -0.75, -0.3, 0.0,
		  -0.33, -0.3, 0.0,

		  -0.75, 0.6     , 0.0,
		  -0.33, -0.3  , 0.0,
		  -0.33, -0.05, 0.0, 

		  -0.75, 0.6     , 0.0,
		  -0.33, -0.3  , 0.0,
		  -0.33, 0.35 , 0.0,

		  -0.75, 0.6     , 0.0,
		  -0.33, 0.35 , 0.0,
		  -0.33, 0.6      , 0.0,

		  -0.33, 0.35, 0.0,
		  -0.18   , 0.35, 0.0,
		  -0.18   , -0.05, 0.0,

		  -0.33, 0.35, 0.0,
		  -0.18    , -0.05, 0.0,
		  -0.33, -0.05, 0.0,		//middle left

		  0.75, 0.6   , 0.0,
		  0.75, -0.3, 0.0,
		  0.33, -0.3, 0.0,

		  0.75, 0.6     , 0.0,
		  0.33, -0.3  , 0.0,
		  0.33, -0.05, 0.0, 

		  0.75, 0.6     , 0.0,
		  0.33, -0.3  , 0.0,
		  0.33, 0.35 , 0.0,

		  0.75, 0.6     , 0.0,
		  0.33, 0.35 , 0.0,
		  0.33, 0.6      , 0.0,

		  0.33, 0.35, 0.0,
		  0.18   , 0.35, 0.0,
		  0.18   , -0.05, 0.0,

		  0.33, 0.35, 0.0,
		  0.18    , -0.05, 0.0,
		  0.33, -0.05, 0.0,		//middle right
		  //make the bottom part of the badge dance
		 -0.75 , -0.35, 0.0,
		 -0.75+Math.sin(deg)*0.12, -0.5  , 0.0,
		 -0.6 + Math.sin(deg)*0.1,  -0.6, 0.0,

		 -0.75, -0.35, 0.0,
		 -0.6+Math.sin(deg)*0.1  ,  -0.6  , 0.0,
		 -0.6  ,  -0.35 , 0.0,

		 -0.48, -0.35, 0.0,
		 -0.48+Math.sin(deg)*0.1, -0.68 , 0.0,
		 -0.33+Math.sin(deg)*0.1, -0.78 , 0.0,

		 -0.48, -0.35, 0.0,
		 -0.33+Math.sin(deg)*0.1, -0.78 , 0.0,
		 -0.33, -0.35, 0.0,

		 -0.21, -0.35, 0.0,
		 -0.21+Math.sin(deg)*0.1, -0.86, 0.0,
		 -0.06+Math.sin(deg)*0.06, -0.96 , 0.0,

		 -0.21,  -0.35, 0.0,
		 -0.06+Math.sin(deg)*0.06, -0.96 , 0.0,
		 -0.06, -0.35, 0.0,

		 0.75, -0.35, 0.0,
		 0.75-Math.sin(deg)*0.12, -0.5 , 0.0,
		 0.6-Math.sin(deg)*0.1  ,  -0.6, 0.0,

		 0.75, -0.35, 0.0,
		 0.6  -Math.sin(deg)*0.1,  -0.6  , 0.0,
		 0.6  ,  -0.35 , 0.0,

		 0.48, -0.35, 0.0,
		 0.48-Math.sin(deg)*0.1,  -0.68, 0.0,
		 0.33-Math.sin(deg)*0.1, -0.78 , 0.0,

		 0.48, -0.35, 0.0,
		 0.33-Math.sin(deg)*0.1 ,  -0.78, 0.0,
		 0.33, -0.35, 0.0,

		 0.21, -0.35, 0.0,
		 0.21-Math.sin(deg)*0.1, -0.86 , 0.0,
		 0.06-Math.sin(deg)*0.06, -0.96, 0.0,

		 0.21,  -0.35, 0.0,
		 0.06-Math.sin(deg)*0.06, -0.96 , 0.0,
		 0.06, -0.35, 0.0			//bottom
	];
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
	vertexPositionBuffer.itemSize = 3;
	vertexPositionBuffer.numberOfItems = 93;
}

/*tell browser we are ready to update animation onscreen, and draw the new frame on screen.*/
function tick() {
	requestAnimFrame(tick);
	draw();
	animate();
}