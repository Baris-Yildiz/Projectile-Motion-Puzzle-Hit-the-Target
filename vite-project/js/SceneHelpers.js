import {THREE} from "./LibImports.js";

let rainTimer = new THREE.Vector2(0.0, 0.0);

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

        material = new THREE.MeshStandardMaterial({
            map: textures[0],
            bumpMap: textures[1],
            bumpScale: 1.3,
            aoMap: textures[2],
            normalMap: textures[3],
            roughnessMap: textures[4],
            color: color,
            transparent: true,
        });

    }

    let mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width,height,depth, 1, 1, 1),
        material
    );

    loadShaders(material, width, height);

    mesh.position.copy(pos);
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    return mesh;
}

function loadShaders(material, width, height) {
    //rain puddle shader
    material.onBeforeCompile = (shader) => {

        shader.uniforms.iTime = { value: rainTimer };
        shader.uniforms.iUVRes = {value: new THREE.Vector2(width, height) };

        material.userData.shaderUniforms = shader.uniforms;

        shader.vertexShader = shader.vertexShader.replace('#include <common>',
            rainPuddleVertexShaderAttributes
        );
        shader.vertexShader = shader.vertexShader.replace('}',
            rainPuddleVertexShaderEndOfMain
        );

        shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
            rainPuddleFragmentShaderBeforeMain
        );
        shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>',
            rainPuddleFragmentShaderEndOfMain
        );};
}

function createBoxCollider(width, height, depth, pos) {
    let mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width,height,depth, 1, 1, 1),
        new THREE.MeshStandardMaterial({color: 0xff0000})
    );
    pos.y += height/2;
    mesh.position.copy(pos);
    mesh.material.visible = false;
    mesh.userData.isCollider = true;

    return mesh;
}

export {createBox, rainTimer, createBoxCollider};