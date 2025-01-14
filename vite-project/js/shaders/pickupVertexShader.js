const pickupVertexShader = `
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
        
        vec3 object_pos = vec3(
            position.x + rand * velocity.x*time,
            position.y + rand * 3.0 * velocity.y*time,
            position.z + velocity.z*time);
        o_color = u_color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(object_pos, 1);
    }
`