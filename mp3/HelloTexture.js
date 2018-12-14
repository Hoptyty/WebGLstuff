
var gl;
var canvas;

var shaderProgram_0;
var shaderProgram_1;

// Create a place to store the texture coords for the mesh
var cubeTCoordBuffer = [];

// Create a place to store terrain geometry
var cubeVertexBuffer = [];

//teapot data
var vertices_teapot = [];
var teapot_indices = [];

//teapot buffer
var teapotVertexBuffer;
var teapotTriIndexBuffer;

// Create a place to store the triangles
var cubeTriIndexBuffer;

// Create ModelView matrix
var mvMatrix = mat4.create();
var vMatrix = mat4.create();

var inverseMatrix = mat3.create();
var worldMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var nMatrix = mat3.create();

var mvMatrixStack = [];

// Create a place to store the texture

var cubeImage = [];
var cubeTexture = [];

// For animation 
var then =0;
var modelXRotationRadians = degToRad(0);
var modelYRotationRadians = degToRad(0);
var modelZRotationRadians = degToRad(0);
var worldYRotationRadians = degToRad(0);

var myMesh;

// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = vec3.fromValues(0.0,0.0,1.0);
/** @global Direction of the view in world coordinates */
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = vec3.fromValues(0.0,1.0,0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = vec3.fromValues(0.0,0.0,0.0);

//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [10,10,10];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0,0,0];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [1,1,1];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular =[1,1,1];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [1.0,1.0,1.0];
/** @global Diffuse material color/intensity for Phong reflection */
var kTerrainDiffuse = [117.0/255.0,26.0/255.0,3.0/255.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [0.5,0.5,0.5];
/** @global Shininess exponent for Phong reflection */
var shininess = 32;
/** @global Edge color fpr wireframeish rendering */
var kEdgeBlack = [0.0,0.0,0.0];
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0,1.0,1.0];

var currentlyPressedKeys = {};

var angle = 0;

/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader0() {
  gl.uniformMatrix4fv(shaderProgram_0.mvMatrixUniform, false, mvMatrix);
  //gl.uniformMatrix4fv(shaderProgram_1.mvMatrixUniform, false, mvMatrix);
}

/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader1() {
  //gl.uniformMatrix4fv(shaderProgram_0.mvMatrixUniform, false, mvMatrix);
  gl.uniformMatrix4fv(shaderProgram_1.mvMatrixUniform, false, mvMatrix);
}

/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader0() {
  gl.uniformMatrix4fv(shaderProgram_0.pMatrixUniform, false, pMatrix);
}

/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader1() {
  gl.uniformMatrix4fv(shaderProgram_1.pMatrixUniform, false, pMatrix);
}

/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader1() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram_1.nMatrixUniform, false, nMatrix);
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
function setMatrixUniforms0() {
    uploadModelViewMatrixToShader0();
    uploadProjectionMatrixToShader0();
}

function setMatrixUniforms1() {
  uploadModelViewMatrixToShader1();
  uploadProjectionMatrixToShader1();
  uploadNormalMatrixToShader1();
  gl.uniformMatrix3fv(shaderProgram_1.uniformInverse, false, inverseMatrix);
  gl.uniformMatrix4fv(shaderProgram_1.worldMVMatrix, false, worldMatrix);
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
  vertexShader_0 = loadShaderFromDOM("shader-vs0");
  fragmentShader_0 = loadShaderFromDOM("shader-fs0");
  
  shaderProgram_0 = gl.createProgram();
  gl.attachShader(shaderProgram_0, vertexShader_0);
  gl.attachShader(shaderProgram_0, fragmentShader_0);
  gl.linkProgram(shaderProgram_0);

  if (!gl.getProgramParameter(shaderProgram_0, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  vertexShader_1 = loadShaderFromDOM("shader-vs1");
  fragmentShader_1 = loadShaderFromDOM("shader-fs1");
  
  shaderProgram_1 = gl.createProgram();
  gl.attachShader(shaderProgram_1, vertexShader_1);
  gl.attachShader(shaderProgram_1, fragmentShader_1);
  gl.linkProgram(shaderProgram_1);

  if (!gl.getProgramParameter(shaderProgram_1, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

}

/**
 * Draw a cube based on buffers.
 * @param i face index of the cube (0-5)
 */
function drawCube(i){

  // Draw the cube by binding the array buffer to the cube's vertices
  // array, setting attributes, and pushing it to GL.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer[i]);
  gl.vertexAttribPointer(shaderProgram_0.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTCoordBuffer[i]);
  gl.vertexAttribPointer(shaderProgram_0.texCoordAttribute, 2, gl.FLOAT, false, 0, 0);

  // Specify the texture to map onto the faces.

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture[i]);
  gl.uniform1i(gl.getUniformLocation(shaderProgram_0, "uSampler"), 0);

  // Draw the cube.

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeTriIndexBuffer);
  //setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

/**
 *  Draw a teapot based on buffers
 */
/**
 * Draw call that applies matrix transformations to cube
 */
function draw() { 
    var transformVec = vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);
    
    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    //vec3.rotateY(eyePt,eyePt,vec3.fromValues(0.0,0.0,0.0),0.001);
    // Then generate the lookat matrix and initialize the view matrix to that view
    mat4.lookAt(vMatrix,eyePt,viewPt,up);


    useShader0();
    //Draw 
    mvPushMatrix();
    
    //vec3.set(transformVec,0.0,0.0,0.0);
    //mat4.translate(mvMatrix, mvMatrix,transformVec);
    //mat4.rotateX(mvMatrix,mvMatrix,modelXRotationRadians);
    mat4.rotateY(mvMatrix,mvMatrix,worldYRotationRadians);
    //mat4.scale(mvMatrix,mvMatrix,scaleVec);
    mat4.multiply(mvMatrix,vMatrix,mvMatrix);
    
    setMatrixUniforms0();
    mat4.copy(worldMatrix, mvMatrix);
    for (var i = 0; i < 6; i++)
      drawCube(i);
    mat3.fromMat4(inverseMatrix, mvMatrix);
    mat3.invert(inverseMatrix,inverseMatrix);
    if (myMesh.loaded()  == true) {
      useShader1();
      mvPushMatrix();
      vec3.set(transformVec, 0.0,-0.15,0.0);
      var scaleVec = vec3.fromValues(0.1,0.1,0.1);
      mat4.rotateZ(mvMatrix,mvMatrix,modelZRotationRadians);
      mat4.rotateY(mvMatrix,mvMatrix,modelYRotationRadians);
      mat4.rotateX(mvMatrix,mvMatrix,modelXRotationRadians);
      mat4.translate(mvMatrix, mvMatrix, transformVec);
      mat4.scale(mvMatrix,mvMatrix,scaleVec);
      //var temp = mat4.create();
      //mat4.multiply(temp,mvMatrix,vec4.fromValues(1,1,1,1));
      //console.log(temp);
      
      setLightUniforms(lightPosition,lAmbient,lDiffuse,lSpecular);
      setMaterialUniforms(shininess,kAmbient, kTerrainDiffuse,kSpecular); 
      setMatrixUniforms1();
      if(document.getElementById("reflective").checked) {
        //console.log("reflective");
        gl.uniform1i(shaderProgram_1.uniformFlag, 0);
      }
      if(document.getElementById("shading").checked)  {
        //console.log("shading");
        gl.uniform1i(shaderProgram_1.uniformFlag, 1);
      }
      myMesh.drawTriangles();
      mvPopMatrix();
    }
    mvPopMatrix();
  
}

/**
 * Animation to be called from tick. Updates global rotation values.
 */
function animate() {
    if (then==0)
    {
        then = Date.now();
    }
    else
    {
        now=Date.now();
        // Convert to seconds
        now *= 0.001;
        // Subtract the previous time from the current time
        var deltaTime = now - then;
        // Remember the current time for the next frame.
        then = now;

        //Animate the rotation
        //modelXRotationRadians += 0.2 * deltaTime;
        if (currentlyPressedKeys["a"]) {
          modelYRotationRadians -= 0.5 * deltaTime;
        }
        else if (currentlyPressedKeys["d"]) {
          modelYRotationRadians += 0.5 * deltaTime;
        }
        else if (currentlyPressedKeys["w"]) {
          modelXRotationRadians -= 0.5 * deltaTime;
        }
        else if (currentlyPressedKeys["s"]) {
          modelXRotationRadians += 0.5 * deltaTime;
        }
        else if (currentlyPressedKeys["q"]) {
          modelZRotationRadians += 0.5 * deltaTime;
        }
        else if (currentlyPressedKeys["e"]) {
          modelZRotationRadians -= 0.5 * deltaTime;
        }
        else if (currentlyPressedKeys["k"]) {
          worldYRotationRadians -= 0.5 * deltaTime;
        }
        else if (currentlyPressedKeys["j"]) {
          worldYRotationRadians += 0.5 * deltaTime;
        }
    }
}

/**
 * Creates texture for application to cube.
 */
function setupTextures(filename) {
  cubeTexture[0] = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture[0]);
  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

  cubeImage[0] = new Image();
  cubeImage[0].onload = function() { handleTextureLoaded(cubeImage[0], cubeTexture[0]); }
  cubeImage[0].src = filename + "/Main Camera_front.png";

  cubeTexture[1] = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture[1]);
  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

  cubeImage[1] = new Image();
  cubeImage[1].onload = function() { handleTextureLoaded(cubeImage[1], cubeTexture[1]); }
  cubeImage[1].src = filename + "/Main Camera_back.png";

  cubeTexture[2] = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture[2]);
  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

  cubeImage[2] = new Image();
  cubeImage[2].onload = function() { handleTextureLoaded(cubeImage[2], cubeTexture[2]); }
  cubeImage[2].src = filename + "/Main Camera_up.png";

  cubeTexture[3] = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture[3]);
  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

  cubeImage[3] = new Image();
  cubeImage[3].onload = function() { handleTextureLoaded(cubeImage[3], cubeTexture[3]); }
  cubeImage[3].src = filename + "/Main Camera_down.png";

  cubeTexture[4] = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture[4]);
  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

  cubeImage[4] = new Image();
  cubeImage[4].onload = function() { handleTextureLoaded(cubeImage[4], cubeTexture[4]); }
  cubeImage[4].src = filename + "/Main Camera_right.png";

  cubeTexture[5] = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture[5]);
  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

  cubeImage[5] = new Image();
  cubeImage[5].onload = function() { handleTextureLoaded(cubeImage[5], cubeTexture[5]); }
  cubeImage[5].src = filename + "/Main Camera_left.png";
}

/**
 * @param {number} value Value to determine whether it is a power of 2
 * @return {boolean} Boolean of whether value is a power of 2
 */
function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

/**
 * Texture handling. Generates mipmap and sets texture parameters.
 * @param {Object} image Image for cube application
 * @param {Object} texture Texture for cube application
 */
function handleTextureLoaded(image, texture) {
  console.log("handleTextureLoaded, image = " + image);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
  // Check if the image is a power of 2 in both dimensions.
  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
     // Yes, it's a power of 2. Generate mips.
     gl.generateMipmap(gl.TEXTURE_2D);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
     console.log("Loaded power of 2 texture");
  } else {
     // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
     console.log("Loaded non-power of 2 texture");
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

/**
 * Sets up buffers for cube.
 */
/**
 * Populate buffers with data
 */
function setupCubeBuffers() {

  // Create a buffer for the cube's vertices.

  cubeVertexBuffer[0] = gl.createBuffer();

  // Select the cubeVerticesBuffer as the one to apply vertex
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer[0]);

  // Now create an array of vertices for the cube.

  var vertices_0 = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,
  ];

  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices_0), gl.STATIC_DRAW);

  // Map the texture onto the cube's faces.

  cubeTCoordBuffer[0] = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTCoordBuffer[0]);

  var textureCoordinates_0 = [
    // Front
    0.0,  1.0,
      1.0,  1.0,
    1.0,  0.0,
    0.0,  0.0,
     
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates_0),
                gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.

  cubeTriIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeTriIndexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  var cubeVertexIndices = [
    0,  1,  2,      0,  2,  3,    // front
  ]

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    
  
  
  
  
  cubeVertexBuffer[1] = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer[1]);


  var vertices_1 = [
    // Front face
    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,
  ];


  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices_1), gl.STATIC_DRAW);

  cubeTCoordBuffer[1] = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTCoordBuffer[1]);

  var textureCoordinates_1 = [
    // Front
    1.0,  1.0,
    1.0,  0.0,
    0.0,  0.0,
    0.0,  1.0,
    
    

  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates_1),
                gl.STATIC_DRAW);
    
  
  
  
  /**third**/
   cubeVertexBuffer[2] = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer[2]);


  var vertices_2 = [
   // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,
  ];


  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices_2), gl.STATIC_DRAW);

  cubeTCoordBuffer[2] = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTCoordBuffer[2]);

  var textureCoordinates_2 = [
    // Front
    0.0,  0.0,
    0.0,  1.0,
     1.0,  1.0,
    1.0,  0.0,
    
    
    
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates_2),
                gl.STATIC_DRAW);
    
 
  
  
  /**fourth**/
   cubeVertexBuffer[3] = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer[3]);


  var vertices_3 = [
   // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

  ];


  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices_3), gl.STATIC_DRAW);

  cubeTCoordBuffer[3] = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTCoordBuffer[3]);

  var textureCoordinates_3 = [
    // Front
    0.0,  1.0,
     1.0,  1.0,
    1.0,  0.0,
    0.0,  0.0,
     
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates_3),
                gl.STATIC_DRAW);
    
  
  
  /**fifth**/
  
   cubeVertexBuffer[4] = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer[4]);


  var vertices_4 = [
    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

  ];


  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices_4), gl.STATIC_DRAW);

  cubeTCoordBuffer[4] = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTCoordBuffer[4]);

  var textureCoordinates_4 = [
    // Front
     1.0,  1.0,
    1.0,  0.0,
    0.0,  0.0,
     0.0,  1.0,
   
   
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates_4),
                gl.STATIC_DRAW);
    
  
  
  /**last one**/
   cubeVertexBuffer[5] = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer[5]);


  var vertices_5 = [
    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0
  ];


  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices_5), gl.STATIC_DRAW);

  cubeTCoordBuffer[5] = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTCoordBuffer[5]);

  var textureCoordinates_5 = [
    // Front
    0.0,  1.0,
    1.0,  1.0,
    1.0,  0.0,
    0.0,  0.0,
     
   
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates_5),
                gl.STATIC_DRAW);
    
  
}


/**
 * Startup function called from html code to start program.
 */
 function startup() {
  //readTextFile('teapot.obj', parseobj);
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  
  
  setupShaders();
  setupCubeBuffers();
  setupTextures('valskaya');
  setupMesh('teapot.obj');
  //console.log(teapot_indices.length);
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
  document.getElementById("map").onchange = function() {
    var map = document.getElementById("map");
    setupTextures(map.value);
    myMesh.setupTextures(map.value);
  };
  //setupTextures();
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
 * Gets a file from the server for processing on the client side.
 *
 * @param  file A string that is the name of the file to get
 * @param  callbackFunction The name of function (NOT a string) that will receive a string holding the file
 *         contents.
 *
 */


// function readTextFile(file, callbackFunction)
// {
//     console.log("reading "+ file);
//     var rawFile = new XMLHttpRequest();
//     var allText = [];
//     rawFile.open("GET", file, true);
    
//     rawFile.onreadystatechange = function ()
//     {
//         if(rawFile.readyState === 4)
//         {
//             if(rawFile.status === 200 || rawFile.status == 0)
//             {
//                  callbackFunction(rawFile.responseText);
//                  console.log("Got text file!");
                 
//             }
//         }
//     }
//     //console.log(teapot_indices.length);
//     rawFile.send(null);
// }

/**
 * Parse the .obj file into vertices data
 * @param str A string holding the file contents.
 */

 // function parseobj(str) {
 //    var lines = str.split("\n");
 //    for (var i = 0; i < lines.length; i++) {
 //      var data = lines[i].split(" ");
 //      if (data[0] == 'v') {
 //        vertices_teapot.push(parseFloat(data[1]));
 //        vertices_teapot.push(parseFloat(data[2]));
 //        vertices_teapot.push(parseFloat(data[3]));
 //      }
 //      else if (data[0] == 'f') {
 //        teapot_indices.push(parseInt(data[2])-1);
 //        teapot_indices.push(parseInt(data[3])-1);
 //        teapot_indices.push(parseInt(data[4])-1);
 //      }
 //    }
 //    //console.log(teapot_indices.length);
 // }

 /**
 * Populate buffers with data
 */
function setupMesh(filename) {
    myMesh = new TriMesh();
    myPromise = asyncGetFile(filename);
    // We define what to do when the promise is resolved with the then() call,
    // and what to do when the promise is rejected with the catch() call
    myPromise.then((retrievedText) => {
        myMesh.loadFromOBJ(retrievedText);
        console.log("Yay! got the file");
    })
    .catch(
        // Log the rejection reason
       (reason) => {
            console.log('Handle rejected promise ('+reason+') here.');
        });
}

/**
 * Asynchronously read a server-side text file
 */
function asyncGetFile(url) {
  console.log("Getting text file");
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = () => resolve(xhr.responseText);
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send();
    console.log("Made promise");  
  });
}

function useShader0() {
  gl.useProgram(shaderProgram_0);

  
  shaderProgram_0.texCoordAttribute = gl.getAttribLocation(shaderProgram_0, "aTexCoord");
  //console.log("Tex coord attrib: ", shaderProgram_0.texCoordAttribute);
  gl.enableVertexAttribArray(shaderProgram_0.texCoordAttribute);
    
  shaderProgram_0.vertexPositionAttribute = gl.getAttribLocation(shaderProgram_0, "aVertexPosition");
  //console.log("Vertex attrib: ", shaderProgram_0.vertexPositionAttribute);
  gl.enableVertexAttribArray(shaderProgram_0.vertexPositionAttribute);
    
  shaderProgram_0.mvMatrixUniform = gl.getUniformLocation(shaderProgram_0, "uMVMatrix");
  shaderProgram_0.pMatrixUniform = gl.getUniformLocation(shaderProgram_0, "uPMatrix");
}

function useShader1() {
  gl.useProgram(shaderProgram_1);

  shaderProgram_1.vertexPositionAttribute = gl.getAttribLocation(shaderProgram_1, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram_1.vertexPositionAttribute);

  shaderProgram_1.vertexNormalAttribute = gl.getAttribLocation(shaderProgram_1, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram_1.vertexNormalAttribute);

  shaderProgram_1.mvMatrixUniform = gl.getUniformLocation(shaderProgram_1, "uMVMatrix");
  shaderProgram_1.pMatrixUniform = gl.getUniformLocation(shaderProgram_1, "uPMatrix");
  shaderProgram_1.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram_1, "uLightPosition");
  shaderProgram_1.nMatrixUniform = gl.getUniformLocation(shaderProgram_1, "uNMatrix");
      
  shaderProgram_1.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram_1, "uAmbientLightColor");  
  shaderProgram_1.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram_1, "uDiffuseLightColor");
  shaderProgram_1.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram_1, "uSpecularLightColor");
  shaderProgram_1.uniformShininessLoc = gl.getUniformLocation(shaderProgram_1, "uShininess");    
  shaderProgram_1.uniformAmbientMaterialColorLoc = gl.getUniformLocation(shaderProgram_1, "uKAmbient");  
  shaderProgram_1.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(shaderProgram_1, "uKDiffuse");
  shaderProgram_1.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram_1, "uKSpecular");
  shaderProgram_1.uniformInverse = gl.getUniformLocation(shaderProgram_1, "uInverse");
  shaderProgram_1.uniformFlag = gl.getUniformLocation(shaderProgram_1, "uFlag");
  shaderProgram_1.worldMVMatrix = gl.getUniformLocation(shaderProgram_1, "uWorld");
}

//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(alpha,a,d,s) {
  gl.uniform1f(shaderProgram_1.uniformShininessLoc, alpha);
  gl.uniform3fv(shaderProgram_1.uniformAmbientMaterialColorLoc, a);
  gl.uniform3fv(shaderProgram_1.uniformDiffuseMaterialColorLoc, d);
  gl.uniform3fv(shaderProgram_1.uniformSpecularMaterialColorLoc, s);
}

//-------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function setLightUniforms(loc,a,d,s) {
  gl.uniform3fv(shaderProgram_1.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram_1.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram_1.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram_1.uniformSpecularLightColorLoc, s);
}

//----------------------------------------------------------------------------------
//Code to handle user interaction

function handleKeyDown(event) {
        //console.log("Key down ", event.key, " code ", event.code);
        currentlyPressedKeys[event.key] = true;
}

function handleKeyUp(event) {
        //console.log("Key up ", event.key, " code ", event.code);
        currentlyPressedKeys[event.key] = false;
}
