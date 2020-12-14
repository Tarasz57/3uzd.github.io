const r = 1;
const R = 5;


$(function () {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    var renderer = createRenderer();

    generatePoints(scene);


    camera.position.x = -10;
    camera.position.y = 20;
    camera.position.z = 35;
    camera.lookAt(scene.position);

    // add the output of the renderer to the html element
    $("#WebGL-output").append(renderer.domElement);
    var controls = new THREE.TrackballControls(camera, renderer.domElement);
    render();

    function render() {
        renderer.render(scene, camera);
        requestAnimationFrame(render);
        controls.update();
    }
});

function createRenderer() {
    var renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0xFFFFFF, 1.0); // background color
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;
    return renderer;
}

function getRandomNumber() {
    let negative;
    if(Math.random() < 0.5){
        negative = -1;
    } else {
        negative = 1;
    }
    const pad = R * 1.5;
    const number = Math.random() * (R + pad);
    return number * negative;
}

function getU(vertex) {
    const fi = Math.atan2(vertex.x, vertex.z);
    const u = fi / (2 * Math.PI) + 0.5
    return u;
}

function getV(vertex) {
    const fi = Math.atan2(vertex.x, vertex.z);
    const w = (vertex.x / Math.sin(fi)) - R;
    const psi = Math.atan2(vertex.y, w);
    const v = psi / Math.PI + 0.5;
    return v;
}

function generatePoints(scene) {
    const numberOfPoints = 50000;

    var points = [];
    var uvs = [];

    for (var i = 0; i < numberOfPoints; i++) {
        let randomX = getRandomNumber();
        let randomY = getRandomNumber();
        let randomZ = getRandomNumber();

        const leftSideSubPart = Math.pow(randomX, 2) + Math.pow(randomY, 2) + Math.pow(randomZ, 2) - Math.pow(r, 2);
        const leftSide = Math.pow(leftSideSubPart, 2);
        const rightSide = 4 * Math.pow(R, 2) * (Math.pow(randomX, 2) + Math.pow(randomZ, 2));
        if (leftSide <= rightSide) {
            points.push(new THREE.Vector3(randomX, randomY, randomZ));
        }
    }

    const hullGeometry = new THREE.ConvexGeometry(points);
    const upperFaces2d = hullGeometry.faceVertexUvs[0];
    const geometryFaces3d = hullGeometry.faces;
    const vertices = hullGeometry.vertices;

    const facesCount = upperFaces2d.length;

    var upperFace;
    var geometryFace;
    for (var i = 0; i < facesCount; i++) {

        geometryFace = geometryFaces3d[i];

        const vertex1 = vertices[geometryFace.a];
        const vertex2 = vertices[geometryFace.b];
        const vertex3 = vertices[geometryFace.c]; 

        upperFace = upperFaces2d[i];

        upperFace[0].x = getU(vertex1);
        upperFace[0].y = getV(vertex1);

        upperFace[1].x = getU(vertex2);
        upperFace[1].y = getV(vertex2);
        upperFace[2].x = getU(vertex3);
        upperFace[2].y = getV(vertex3);

        adjustSeam(upperFace[0], upperFace[1]);
        adjustSeam(upperFace[1], upperFace[2]);
        adjustSeam(upperFace[2], upperFace[0]);

    }

    const loader = new THREE.TextureLoader();
    loader.load(
        'chess.jpg',
        function (texture) {

            const material = new THREE.MeshBasicMaterial();
            material.map = texture;

            // const basicMaterial = new THREE.MeshLambertMaterial({ color: 0xe5a970 });
            const mesh = THREE.SceneUtils.createMultiMaterialObject(hullGeometry, [material]);

            scene.add(mesh);
        });
}

function adjustSeam(face1, face2) {
    const dif = 0.9;
    if (Math.abs(face1.x - face2.x) > dif) {
        const faceToAdjust = face1.x > face2.x ? face1 : face2;
        faceToAdjust.x = 0;
    }
}
