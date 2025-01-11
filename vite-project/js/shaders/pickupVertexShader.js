const pickupVertexShader = `
    uniform vec3 init_vel;
    uniform float t; 
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
            position.x + rand * init_vel.x*t,
            position.y + rand * 3.0 * init_vel.y*t,
            position.z + init_vel.z*t);
        o_color = u_color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(object_pos, 1);
    }
`