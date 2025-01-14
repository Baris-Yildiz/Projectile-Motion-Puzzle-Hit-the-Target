const smokeVertexShader = `
    uniform vec3 velocity;
    uniform float time; 
    uniform vec4 u_color;
    uniform float u_life;
    uniform float rand;
    
    out vec4 o_color;
    out vec2 f_uv;
        
    void main()
    {
        if (u_life <= 0.0) return;
        f_uv = uv;
        vec3 object_pos;
        object_pos.x = position.x + rand * 3.0 * velocity.x*time;
        object_pos.y = position.y + rand * 3.0 * velocity.y*time*2.0;
        object_pos.z = position.z + velocity.z*time;
        o_color = u_color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(object_pos, 1);
    }
`