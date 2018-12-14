/**
 * @fileoverview Terrain - A simple 3D terrain using WebGL
 * @author Eric Shaffer
 */

/** Class implementing 3D terrain. */
class Terrain{   
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
 */
    constructor(div,minX,maxX,minY,maxY){
        this.div = div;
        this.minX=minX;
        this.minY=minY;
        this.maxX=maxX;
        this.maxY=maxY;
        
        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        this.faceNormals = [];
        this.cBuffer = [];
        console.log("Terrain: Allocated buffers");
        
        this.generateTriangles();
        this.vBuffer[2] = 0.01;
        this.vBuffer[div/2*3+2] =0.01;
        this.vBuffer[div*3+2] = 0.01;
        this.vBuffer[div/2*(div+1)*3+2] = 0.01;
        this.vBuffer[div/2*(div+2)*3+2] = 0.15;
        this.vBuffer[div/2*(div+3)*3+2] = 0.01;
        this.vBuffer[div*(div+1)*3+2] = 0.01;
        this.vBuffer[(div*(div+1)+div/2)*3+2] = 0.01;
        this.vBuffer[this.vBuffer.length-1] = 0.01;
        this.randomize();
        this.addColor();
        this.getFaceNormal();
        this.getVertexNormal();

        console.log("Terrain: Generated triangles");
        
        this.generateLines();
        console.log("Terrain: Generated lines");
        
        // Get extension for 4 byte integer indices for drwElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
    }
    
    /**
    * Set the x,y,z coords of a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setVertex(v,i,j)
    {
        //Your code here
        var vid = 3*(i*(this.div+1) + j);
        this.vbuffer[vid] = v[0];
        this.vbuffer[vid+1] = v[1];
        this.vbuffer[vid+2] = v[2];
    }
    
    /**
    * Return the x,y,z coordinates of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getVertex(v,i,j)
    {
        //Your code here
        var vid = 3*(i*(this.div+1) + j);
        v[0] = this.vbuffer[vid];
        v[1] = this.vbuffer[vid+1];
        v[2] = this.vbuffer[vid+2];
    }
    
    /**
    * Send the buffer objects to WebGL for rendering 
    */
    loadBuffers()
    {
        // Specify the vertex coordinates
        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");
    
        // Specify normals to be able to do lighting calculations
        this.VertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                  gl.STATIC_DRAW);
        this.VertexNormalBuffer.itemSize = 3;
        this.VertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");

        this.VertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.cBuffer),
                  gl.STATIC_DRAW);
        this.VertexColorBuffer.itemSize = 3;
        this.VertexColorBuffer.numItems = this.numVertices;
    
        // Specify faces of the terrain 
        this.IndexTriBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                  gl.STATIC_DRAW);
        this.IndexTriBuffer.itemSize = 1;
        this.IndexTriBuffer.numItems = this.fBuffer.length;
        console.log("Loaded ", this.numFaces, " triangles");
    
        //Setup Edges  
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;
        
        console.log("triangulatedPlane: loadBuffers");
    }
    
    /**
    * Render the triangles 
    */
    drawTriangles(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   

        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 3, gl.FLOAT, false, 0, 0);
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }
    
    /**
    * Render the triangle edges wireframe style 
    */
    drawEdges(){
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);   
    }
/**
 * Fill the vertex and buffer arrays 
 */    
generateTriangles()
{
    //Your code here
    var x_amount = (this.maxX - this.minX) / this.div
    var y_amount = (this.maxY - this.minY) / this.div

    for (var i = 0; i <= this.div; i++) {
        for (var j = 0; j <= this.div; j++) {
            this.vBuffer.push(j*x_amount + this.minX)
            this.vBuffer.push(this.minY + i*y_amount)
            this.vBuffer.push(0)

            this.nBuffer.push(0)
            this.nBuffer.push(0)
            this.nBuffer.push(1)
        }
    }

    for (var i = 0; i < this.div; i++) {
        for (var j = 0; j < this.div; j++) {

            var vid = i*(this.div+1) + j

            this.fBuffer.push(vid)
            this.fBuffer.push(vid + this.div+1)
            this.fBuffer.push(vid + this.div+2)

            this.fBuffer.push(vid)
            this.fBuffer.push(vid+1)
            this.fBuffer.push(vid + this.div+2)
        }
    }
    
    this.numVertices = this.vBuffer.length/3;
    this.numFaces = this.fBuffer.length/3;
}

/**
 * Print vertices and triangles to console for debugging
 */
printBuffers()
    {
        
    for(var i=0;i<this.numVertices;i++)
          {
           console.log("v ", this.vBuffer[i*3], " ", 
                             this.vBuffer[i*3 + 1], " ",
                             this.vBuffer[i*3 + 2], " ");
                       
          }
    
      for(var i=0;i<this.numFaces;i++)
          {
           console.log("f ", this.fBuffer[i*3], " ", 
                             this.fBuffer[i*3 + 1], " ",
                             this.fBuffer[i*3 + 2], " ");
                       
          }
        
    }

/**
 * Generates line values from faces in faceArray
 * to enable wireframe rendering
 */
generateLines()
{
    var numTris=this.fBuffer.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        this.eBuffer.push(this.fBuffer[fid]);
        this.eBuffer.push(this.fBuffer[fid+1]);
        
        this.eBuffer.push(this.fBuffer[fid+1]);
        this.eBuffer.push(this.fBuffer[fid+2]);
        
        this.eBuffer.push(this.fBuffer[fid+2]);
        this.eBuffer.push(this.fBuffer[fid]);
    }
    
}


/**
 *Diamond-square algorithm to generate random terrain.
**/
randomize() {
    var len = this.div;
    var width = this.div + 1;
    var iter = 1;
    var r = 0.1;
    while (len > 1) {
        len = Math.floor(len / 2);
        var pert = r / iter;
        for (var i = 0; i < iter; i++) {
            for (var j = 0; j < iter; j++) {
                //console.log(r/iter)
                
                var col = i * len*2 + len;
                var row = j * len*2 + len;
                if (col < this.div/2 || row < this.div/2)
                    pert = r/2/iter;
                var idx = row * width + col;
                var ul = this.vBuffer[(j*len*2*width+i*len*2)*3+2];
                var ur = this.vBuffer[(j*len*2*width+(i+1)*len*2)*3+2];
                var ll = this.vBuffer[((j+1)*len*2*width+i*len*2)*3+2];
                var lr = this.vBuffer[((j+1)*len*2*width+(i+1)*len*2)*3+2];
                if (this.vBuffer[idx*3+2] == 0)
                    this.vBuffer[idx*3+2] = (ul+ur+ll+lr)/4 + Math.random()*pert;
                var mid = this.vBuffer[idx*3+2];
                var lo = (col-len*2<0) ? 0 : this.vBuffer[(idx-len*2)*3+2];
                var to = (row-len*2<0) ? 0 : this.vBuffer[(idx-len*2*width)*3+2];
                var ro = (col+len*2>this.div) ? 0 : this.vBuffer[(idx+len*2)*3+2];
                var bo = (row+len*2>this.div) ? 0 : this.vBuffer[(idx+len*2*width)*3+2];
                var lid = idx - len;
                var rid = idx + len;
                var tid = idx - len*width;
                var bid = idx + len*width;
                if (this.vBuffer[lid*3+2] == 0)
                    this.vBuffer[lid*3+2] = (lo+ul+mid+ll)/4 + Math.random()*pert;
                if (this.vBuffer[rid*3+2] == 0)
                    this.vBuffer[rid*3+2] = (mid+ur+ro+lr)/4 + Math.random()*pert;
                if (this.vBuffer[tid*3+2] == 0)
                    this.vBuffer[tid*3+2] = (ul+to+ur+mid)/4 + Math.random()*pert;
                if (this.vBuffer[bid*3+2] == 0)
                    this.vBuffer[bid*3+2] = (ll+mid+lr+bo)/4 + Math.random()*pert;
            }
        }
        iter *= 2;
    }
}


/**
* Caculate the normal of the each face
**/
getFaceNormal() {
    for (var i = 0; i < this.div; i++) {
        for (var j = 0; j < this.div; j++) {

            var idx = i * this.div + j;
            var v0 = vec3.fromValues(this.vBuffer[this.fBuffer[idx*6]*3],this.vBuffer[this.fBuffer[idx*6]*3+1],this.vBuffer[this.fBuffer[idx*6]*3+2]);
            var v1 = vec3.fromValues(this.vBuffer[this.fBuffer[idx*6+1]*3],this.vBuffer[this.fBuffer[idx*6+1]*3+1],this.vBuffer[this.fBuffer[idx*6+1]*3+2]);
            var v2 = vec3.fromValues(this.vBuffer[this.fBuffer[idx*6+2]*3],this.vBuffer[this.fBuffer[idx*6+2]*3+1],this.vBuffer[this.fBuffer[idx*6+2]*3+2]);
            var v3 = vec3.fromValues(this.vBuffer[this.fBuffer[idx*6+4]*3],this.vBuffer[this.fBuffer[idx*6+4]*3+1],this.vBuffer[this.fBuffer[idx*6+4]*3+2]);
            
            var n1 = vec3.create();
            var n2 = vec3.create();
            var v0v1 = vec3.create();
            vec3.sub(v0v1, v1, v0);
     
            var v0v2 = vec3.create();
            vec3.sub(v0v2, v2, v0);

            var v0v3 = vec3.create();
            vec3.sub(v0v3, v3, v0);
     
            vec3.cross(n1, v0v2, v0v1);
            vec3.cross(n2, v0v3, v0v2);

            vec3.normalize(n1,n1);
            vec3.normalize(n2,n2);

            //console.log(n1,n2,v0,v1,v2,v3);


            this.faceNormals.push(n1[0]);
            this.faceNormals.push(n1[1]);
            this.faceNormals.push(n1[2]);
            this.faceNormals.push(n2[0]);
            this.faceNormals.push(n2[1]);
            this.faceNormals.push(n2[2]);
        }
    }
}

/**
* Calculate normal of each vertex based on the normal of adjacent faces.
**/
getVertexNormal() {
    for (var i = 0; i <= this.div ; i++) {
        for (var j = 0; j <= this.div; j++) {
            var idx = j * (this.div + 1) + i;
            var count = 0;
            var normal = vec3.fromValues(0,0,0);
            if (i > 0 && j > 0) {
                var fid1 = this.div * 2 * (j - 1) + 2 * (i - 1);
                var temp = vec3.fromValues(this.faceNormals[fid1*3],this.faceNormals[fid1*3+1],this.faceNormals[fid1*3+2]);
                //console.log(vec3.length(normal));
                vec3.add(normal,normal,temp);
                //console.log(vec3.length(normal),temp);
                var fid2 = this.div * 2 * (j - 1) + 2 * (i - 1) + 1;
                temp = vec3.fromValues(this.faceNormals[fid2*3],this.faceNormals[fid2*3+1],this.faceNormals[fid2*3+2]);
                //console.log(normal)
                vec3.add(normal,normal,temp);
                //console.log(normal,temp);
                //console.log(i,j,fid1,fid2,temp,this.faceNormals.length);
                count += 2;
            }
            if (i < this.div && j < this.div) {
                var fid1 = this.div * 2 * j + 2 * i;
                var temp = vec3.fromValues(this.faceNormals[fid1*3],this.faceNormals[fid1*3+1],this.faceNormals[fid1*3+2]);
                vec3.add(normal,normal,temp);
                var fid2 = this.div * 2 * j + 2 * i + 1;
                temp = vec3.fromValues(this.faceNormals[fid2*3],this.faceNormals[fid2*3+1],this.faceNormals[fid2*3+2]);
                vec3.add(normal,normal,temp);
                //console.log(i,j,fid1,fid2);
                count += 2;
            }
            if (i > 0 && j < this.div) {
                var fid1 = this.div * 2 * j + 2 * i - 1;
                var temp = vec3.fromValues(this.faceNormals[fid1*3],this.faceNormals[fid1*3+1],this.faceNormals[fid1*3+2]);
                vec3.add(normal,normal,temp);
                //console.log(i,j,fid1);
                count += 1;
            }
            if (j > 0 && i < this.div) {
                var fid1 = this.div * 2 * (j - 1) + 2 * i;
                var temp = vec3.fromValues(this.faceNormals[fid1*3],this.faceNormals[fid1*3+1],this.faceNormals[fid1*3+2]);
                vec3.add(normal,normal,temp);
                //console.log(i,j,fid1);
                count += 1;
            }
            //console.log(vec3.length(normal),count)
            vec3.normalize(normal,normal);
            //console.log(vec3.length(normal))
            //idx = i * (this.div + 1) + j;
            this.nBuffer[idx*3] = normal[0];
            this.nBuffer[idx*3+1] = normal[1];
            this.nBuffer[idx*3+2] = normal[2];
        }
    }
}

/**
*Set up vertex color based on height
**/
addColor() {
    for(var i = 0; i < this.vBuffer.length/3; i++) {
        //water
        if(this.vBuffer[i*3 +2] <0.04) { 
            this.cBuffer.push(0);
            this.cBuffer.push(0.7);
            this.cBuffer.push(1);
        }
        //sand
        else if(this.vBuffer[i*3 +2] < 0.05) {
            this.cBuffer.push(0.9);
            this.cBuffer.push(0.8);
            this.cBuffer.push(0.7);
        }
        //stone
        else if(this.vBuffer[i*3 +2] < 0.07) {
            this.cBuffer.push(0.6);
            this.cBuffer.push(0.6);
            this.cBuffer.push(0.7);
        }
        //trees
        else {//(this.vBuffer[i*3 +2] < 0.1) {
            this.cBuffer.push(0.7);
            this.cBuffer.push(0.85);
            this.cBuffer.push(0.2);
        }
        //ice
        // else {
        //     this.cBuffer.push(0.8);
        //     this.cBuffer.push(0.8);
        //     this.cBuffer.push(0.8);
        // }
    }
}
   
}
