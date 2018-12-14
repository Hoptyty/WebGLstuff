
var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

var days=0;


// Create a place to store sphere geometry
var sphereVertexPositionBuffer;

//Create a place to store normals for shading
var sphereVertexNormalBuffer;

// View parameters
var eyePt = vec3.fromValues(0.0,0.0,4.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

var stable = [];
//var position = vec3.fromValues(Math.random()*1.8-0.9,Math.random()*1.8-0.9,Math.random()*1.8-0.9);
//var velocity = vec3.fromValues(Math.random()*10-5,Math.random()*10-5,Math.random()*10-5);
var g = vec3.fromValues(0.0, -5.0, 0.0);
var then = 0;
var now = 0;
var deltaTime = 0;
var total = 0;
var X = 10;
var position = [];
var velocity = [];
var colors = [];

// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var mvMatrixStack = [];

/**
 * Populateds sphere buffers for sphere generation
 */
function setupSphereBuffers() {
    
    var sphereSoup=[];
    var sphereNormals=[];
    var numT=sphereFromSubdivision(6,sphereSoup,sphereNormals);
    console.log("Generated ", numT, " triangles"); 
    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereSoup), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.itemSize = 3;
    sphereVertexPositionBuffer.numItems = numT*3;
    console.log(sphereSoup.length/9);
    
    // Specify normals to be able to do lighting calculations
    sphereVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereNormals),
                  gl.STATIC_DRAW);
    sphereVertexNormalBuffer.itemSize = 3;
    sphereVertexNormalBuffer.numItems = numT*3;
    
    console.log("Normals ", sphereNormals.length/3);     
}

/**
 * Draw sphere from populated buffers
 */
function drawSphere(){
 gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           sphereVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);
 gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);      
}


/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
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
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  shaderProgram.position = gl.getAttribLocation(shaderProgram, "p");
  gl.enableVertexAttribArray(shaderProgram.p);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
    
  shaderProgram.uniformAmbientMatColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientMatColor");  
  shaderProgram.uniformDiffuseMatColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseMatColor");
  shaderProgram.uniformSpecularMatColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularMatColor");    
    
}


/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function uploadLightsToShader(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

/**
 * Sends material information to the shader
 * @param {Float32Array} a Ambient coefficient
 * @param {Float32Array} d Diffuse coefficient
 * @param {Float32Array} s Specular coefficient
 */
function uploadMaterialToShader(a,d,s) {
  gl.uniform3fv(shaderProgram.uniformAmbientMatColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseMatColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularMatColorLoc, s);
}


/**
 * Populate buffers with data
 */
function setupBuffers() {
    setupSphereBuffers();
}

/**
 * Draw all spheres.
 */
function draw() { 
    var transformVec = vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
 
    // Set up light parameters
    var Ia = vec3.fromValues(1.0,1.0,1.0);
    var Id = vec3.fromValues(1.0,1.0,1.0);
    var Is = vec3.fromValues(1.0,1.0,1.0);
    
    var lightPosEye4 = vec4.fromValues(0.0,50.0,150.0,1.0);
    lightPosEye4 = vec4.transformMat4(lightPosEye4,lightPosEye4,mvMatrix);
    //console.log(vec4.str(lightPosEye4))
    var lightPosEye = vec3.fromValues(lightPosEye4[0],lightPosEye4[1],lightPosEye4[2]);
    
    //draw Sun
    // Set up material parameters    
    var ka = vec3.fromValues(0.0,0.0,0.0);
    var kd = vec3.fromValues(0.6,0.8,0.2);
    var ks = vec3.fromValues(0.4,0.4,0.0);
    
    for(var i = 0; i < total; i++){
        mvPushMatrix();
        mat4.translate(mvMatrix, mvMatrix, position[i]);
        vec3.set(transformVec,0.05,0.05,0.05);
        mat4.scale(mvMatrix, mvMatrix,transformVec);
        //console.log(position);
        kd = colors[i % X];
        uploadLightsToShader(lightPosEye,Ia,Id,Is);
        uploadMaterialToShader(ka,kd,ks);
        setMatrixUniforms();
        drawSphere();
        mvPopMatrix();
    }
}

/**
 * Animation to be called from tick. 
 */
function animate() {
    if (then==0)
    {
        then = Date.now();
        then *= 0.001
    }
    else
    {
        now=Date.now();
        // Convert to seconds
        now *= 0.001;
        // Subtract the previous time from the current time
        deltaTime = now - then;
        // Remember the current time for the next frame.
        then = now;
    }
    for(var i = 0; i < total; i++) {
        if(stable[i] == 0){
            vec3.scaleAndAdd(position[i], position[i], velocity[i], deltaTime);
            var drag = Math.pow(0.2, deltaTime);
            var res = 0.9;
            //console.log(drag);
            if(position[i][0] > 0.9){
                position[i][0] = 1.8 - position[i][0];
                velocity[i] = vec3.fromValues(-velocity[i][0]*res, velocity[i][1]*drag, velocity[i][2]*drag);
            }
            if(position[i][0] < -0.9){
                position[i][0] = -1.8 - position[i][0];
                velocity[i] = vec3.fromValues(-velocity[i][0]*res, velocity[i][1]*drag, velocity[i][2]*drag);
            }
            if(position[i][1] > 0.9){
                position[i][1] = 1.8 - position[i][1];
                velocity[i] = vec3.fromValues(velocity[i][0]*drag, -velocity[i][1]*res, velocity[i][2]*drag);
            }
            if(position[i][1] < -0.9){
                position[i][1] = -1.8 - position[i][1];
                velocity[i] = vec3.fromValues(velocity[i][0]*drag, -velocity[i][1]*res, velocity[i][2]*drag);
                //console.log(vec3.length(velocity));
                if(vec3.length(velocity[i]) < 0.05) {
                    stable[i] = 1;
                }
            }
            if(position[i][2] > 0.9){
                position[i][2] = 1.8 - position[i][2];
                velocity[i] = vec3.fromValues(velocity[i][0]*drag, velocity[i][1]*drag, -velocity[i][2]*res);
            }
            if(position[i][2] < -0.9){
                position[i][2] = -1.8 - position[i][2];
                velocity[i] = vec3.fromValues(velocity[i][0]*drag, velocity[i][1]*drag, -velocity[i][2]*res);
            }
            //console.log(velocity);
            vec3.scaleAndAdd(velocity[i], velocity[i], g, deltaTime);
        }
    }
}

/**
 * Startup function called from html code to start program.
 */
function startup() {
  canvas = document.getElementById("myGLCanvas");
  window.addEventListener('keydown', keyPressFunc, false);
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  setupColors();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

/**
 * Tick called for every animation frame.
 */
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}

/**
 * Add event function with code to rotate the camera, control speed and turn the fog on and off.
 * @param {Event} event
 */
function keyPressFunc(event) {
    if(event.keyCode == "32"){
        total += X;
        for(var i = 0; i < X; i++){
            position.push(vec3.fromValues(Math.random()*1.8-0.9,Math.random()*1.8-0.9,Math.random()*1.8-0.9));
            velocity.push(vec3.fromValues(Math.random()*10-5,Math.random()*7.5,Math.random()*10-5));
            stable.push(0);
        }
    }
    if(event.keyCode == "82"){
        position = [];
        velocity = [];
        stable = [];
        total = 0;
        console.log(position);
    }
}

/**
 * Set colors of the spheres.
 */
function setupColors(){
    colors.push(vec3.fromValues(0.7,1.0,0.2));
    colors.push(vec3.fromValues(0.9,0.3,0.1));
    colors.push(vec3.fromValues(0.9,0.2,0.4));
    colors.push(vec3.fromValues(0.2,0.6,1.0));
    colors.push(vec3.fromValues(1.0,1.0,0.0));
    colors.push(vec3.fromValues(0.3,1.0,0.4));
    colors.push(vec3.fromValues(1.0,0.8,0.0));
    colors.push(vec3.fromValues(0.8,0.4,0.7));
    colors.push(vec3.fromValues(0.8,0.8,0.9));
    colors.push(vec3.fromValues(0.0,1.0,1.0));
}

