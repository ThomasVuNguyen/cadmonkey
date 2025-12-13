
import { Document, NodeIO, Accessor, Primitive } from '@gltf-transform/core';
import { Light as LightDef, KHRLightsPunctual } from '@gltf-transform/extensions';
import { Color, Face, IndexedPolyhedron, DEFAULT_FACE_COLOR, Vertex } from './common';

type Geom = {
    positions: Float32Array;
    indices: Uint32Array;
    colors?: Float32Array;
    normals?: Float32Array;
};

// Simple normal calculation
function computeNormals({ vertices, faces }: IndexedPolyhedron): Float32Array {
    const normals = new Float32Array(vertices.length * 3);
    const count = new Uint32Array(vertices.length);

    for (const face of faces) {
        const i0 = face.vertices[0];
        const i1 = face.vertices[1];
        const i2 = face.vertices[2];

        const v0 = vertices[i0];
        const v1 = vertices[i1];
        const v2 = vertices[i2];

        const ax = v1.x - v0.x;
        const ay = v1.y - v0.y;
        const az = v1.z - v0.z;

        const bx = v2.x - v0.x;
        const by = v2.y - v0.y;
        const bz = v2.z - v0.z;

        // Cross product
        const nx = ay * bz - az * by;
        const ny = az * bx - ax * bz;
        const nz = ax * by - ay * bx;

        normals[i0 * 3] += nx; normals[i0 * 3 + 1] += ny; normals[i0 * 3 + 2] += nz; count[i0]++;
        normals[i1 * 3] += nx; normals[i1 * 3 + 1] += ny; normals[i1 * 3 + 2] += nz; count[i1]++;
        normals[i2 * 3] += nx; normals[i2 * 3 + 1] += ny; normals[i2 * 3 + 2] += nz; count[i2]++;
    }

    // Normalize
    for (let i = 0; i < vertices.length; i++) {
        const c = count[i] || 1;
        const nx = normals[i * 3] / c;
        const ny = normals[i * 3 + 1] / c;
        const nz = normals[i * 3 + 2] / c;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        normals[i * 3] = nx / len;
        normals[i * 3 + 1] = ny / len;
        normals[i * 3 + 2] = nz / len;
    }
    return normals;
}


function createPrimitive(doc: Document, baseColorFactor: Color, { positions, indices, colors, normals }: Geom): Primitive {
    const prim = doc.createPrimitive()
        .setMode(Primitive.Mode.TRIANGLES)
        .setMaterial(
            doc.createMaterial()
                .setDoubleSided(true)
                .setAlphaMode(baseColorFactor[3] < 1 ? 'BLEND' : 'OPAQUE')
                .setMetallicFactor(0.0)
                // .setRoughnessFactor(0.8)
                .setBaseColorFactor(baseColorFactor))
        .setAttribute('POSITION',
            doc.createAccessor()
                .setType(Accessor.Type.VEC3)
                .setArray(positions))
        .setIndices(
            doc.createAccessor()
                .setType(Accessor.Type.SCALAR)
                .setArray(indices));

    if (normals) {
        prim.setAttribute('NORMAL',
            doc.createAccessor()
                .setType(Accessor.Type.VEC3)
                .setArray(normals));
    }

    if (colors) {
        prim.setAttribute('COLOR_0',
            doc.createAccessor()
                .setType(Accessor.Type.VEC3)
                .setArray(colors));
    }
    return prim;
}

function getGeom(data: IndexedPolyhedron): Geom {
    let positions = new Float32Array(data.vertices.length * 3);
    const indices = new Uint32Array(data.faces.length * 3);

    const addedVertices = new Map<number, number>();
    let verticesAdded = 0;

    // Naive re-indexer for now to split vertices if needed (flat shading vs smooth)
    // Actually OPENSCAD output is often not sharing vertices between faces if flat shaded
    // But Manifold might share them.
    // For now let's just use raw vertices from polyhedron

    // Re-pack vertices
    const newPositions = [];
    const newIndices = [];

    // Simple pass: just use the vertices as is?
    // data.vertices is array of {x,y,z}.
    // data.faces is array of {vertices: [idx, idx, idx]}

    for (let i = 0; i < data.vertices.length; i++) {
        positions[i * 3] = data.vertices[i].x;
        positions[i * 3 + 1] = data.vertices[i].y;
        positions[i * 3 + 2] = data.vertices[i].z;
    }

    for (let i = 0; i < data.faces.length; i++) {
        indices[i * 3] = data.faces[i].vertices[0];
        indices[i * 3 + 1] = data.faces[i].vertices[1];
        indices[i * 3 + 2] = data.faces[i].vertices[2];
    }

    // Compute normals?
    const normals = computeNormals(data);

    return {
        positions: positions, // .slice(0, verticesAdded * 3),
        indices: indices, // 
        normals
    };
}

export async function exportGlb(data: IndexedPolyhedron, defaultColor: Color = DEFAULT_FACE_COLOR): Promise<Blob> {
    const doc = new Document();
    const lightExt = doc.createExtension(KHRLightsPunctual);
    doc.createBuffer();

    const scene = doc.createScene()
        .addChild(doc.createNode()
            .setExtension('KHR_lights_punctual', lightExt
                .createLight()
                .setType(LightDef.Type.DIRECTIONAL)
                .setIntensity(1.0)
                .setColor([1.0, 1.0, 1.0]))
            .setRotation([-0.3250576, -0.3250576, 0, 0.8880739]))
        .addChild(doc.createNode()
            .setExtension('KHR_lights_punctual', lightExt
                .createLight()
                .setType(LightDef.Type.DIRECTIONAL)
                .setIntensity(1.0)
                .setColor([1.0, 1.0, 1.0]))
            .setRotation([0.6279631, 0.6279631, 0, 0.4597009]));
    ;

    const mesh = doc.createMesh();

    const facesByColor = new Map<number, Face[]>();
    data.faces.forEach(face => {
        let faces = facesByColor.get(face.colorIndex);
        if (!faces) facesByColor.set(face.colorIndex, faces = []);
        faces.push(face);
    });
    for (let [colorIndex, faces] of facesByColor.entries()) {
        let color = data.colors[colorIndex];
        // We need to slice the geometry for this specific color group if we want separate primitives
        // But getGeom works on the WHOLE polyhedron.
        // Optimization: For now just assume one color or let's just make one primitive if all same color.
        // Providing partial geometry is harder.

        // RE-IMPLEMENTATION of getGeom for partial faces
        // This was missing in my manual re-type above, falling back to original logic roughly

        // Let's blindly trust the original logic which I have in context
        // But I need to implement getGeom properly as seen in the file view

    }

    // Re-writing the loop properly based on original file content
    for (let [colorIndex, faces] of facesByColor.entries()) {
        let color = data.colors[colorIndex];

        // Construct a sub-polyhedron for this color
        // This is inefficient but safe
        // Or better: update getGeom to take faces

        const subGeom = getGeomFromFaces(data.vertices, faces);
        mesh.addPrimitive(createPrimitive(doc, color, subGeom));
    }

    scene.addChild(doc.createNode().setMesh(mesh));

    const glb = await new NodeIO().registerExtensions([KHRLightsPunctual]).writeBinary(doc);
    return new Blob([glb as any], { type: 'model/gltf-binary' });
}

function getGeomFromFaces(allVertices: Vertex[], faces: Face[]): Geom {
    let positions = new Float32Array(faces.length * 3 * 3); // Max size
    const indices = new Uint32Array(faces.length * 3);

    const addedVertices = new Map<number, number>();
    let verticesAdded = 0;

    const addVertex = (i: number) => {
        let index = addedVertices.get(i);
        if (index === undefined) {
            const offset = verticesAdded * 3;
            const vertex = allVertices[i];
            positions[offset] = vertex.x;
            positions[offset + 1] = vertex.y;
            positions[offset + 2] = vertex.z;
            index = verticesAdded++;
            addedVertices.set(i, index);
        }
        return index;
    };

    faces.forEach((face, i) => {
        const { vertices } = face;
        const offset = i * 3;
        indices[offset] = addVertex(vertices[0]);
        indices[offset + 1] = addVertex(vertices[1]);
        indices[offset + 2] = addVertex(vertices[2]);
    });

    return {
        positions: positions.slice(0, verticesAdded * 3),
        indices
    };
}
