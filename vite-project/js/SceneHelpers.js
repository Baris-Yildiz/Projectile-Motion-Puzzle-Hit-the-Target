import {THREE} from "./LibImports.js";

function createBox(width, height, depth, pos, color, textureFiles) {

    let material;
    if (textureFiles === undefined) {
        material = new THREE.MeshStandardMaterial({color: color});
    } else {
        let textures = [];
        for (let i = 0; i < textureFiles.length; i++) {
            textures.push( new THREE.TextureLoader().load(textureFiles[i]));
            textures[i].wrapS = THREE.RepeatWrapping;
            textures[i].wrapT = THREE.RepeatWrapping;

            textures[i].repeat.set(width, depth);
        }

        material = new THREE.MeshPhongMaterial({
            map: textures[0],
            bumpMap: textures[1],
            color: color
        });
    }

    let mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width,height,depth),
        material
    );

    mesh.position.copy(pos);
    mesh.receiveShadow = true;

    return mesh;
}

export {createBox};