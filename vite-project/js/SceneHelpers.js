import {THREE} from "./LibImports.js";

function createPlane(width, height, pos, color, textureFiles) {

    let planeMaterial;
    if (textureFiles === undefined) {
        planeMaterial = new THREE.MeshStandardMaterial({color: color});
    } else {
        let textures = [];
        for (let i = 0; i < textureFiles.length; i++) {
            textures.push( new THREE.TextureLoader().load(textureFiles[i]));
            textures[i].wrapS = THREE.RepeatWrapping;
            textures[i].wrapT = THREE.RepeatWrapping;

            textures[i].repeat.set(width, height);
        }

        planeMaterial = new THREE.MeshPhongMaterial({
            map: textures[0],
            bumpMap: textures[1],
            color: color
        });
    }

    let mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width,height),
        planeMaterial
    );

    mesh.position.copy(pos);
    mesh.rotateX(-Math.PI/2.0);
    mesh.receiveShadow = true;

    return mesh;
}

export {createPlane};