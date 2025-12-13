 // Simple cat model built from basic OpenSCAD primitives

// Main body
translate([0, 0, 0])
    scale([1.2, 0.8, 1])
    sphere(r = 20, $fn = 32);

// Head
translate([25, 0, 15])
    sphere(r = 15, $fn = 32);

// Ears
translate([30, 10, 25])
    rotate([0, -30, 0])
    cylinder(h = 12, r1 = 6, r2 = 0, $fn = 16);

translate([30, -10, 25])
    rotate([0, 30, 0])
    cylinder(h = 12, r1 = 6, r2 = 0, $fn = 16);

// Tail
translate([-25, 0, 10])
    rotate([0, 0, -30])
    cylinder(h = 30, r1 = 5, r2 = 2, $fn = 16);

// Legs
translate([10, 12, -20])
    cylinder(h = 20, r = 4, $fn = 16);

translate([10, -12, -20])
    cylinder(h = 20, r = 4, $fn = 16);

translate([-10, 12, -20])
    cylinder(h = 20, r = 4, $fn = 16);

translate([-10, -12, -20])
    cylinder(h = 20, r = 4, $fn = 16);

// Eyes
translate([32, 8, 18])
    sphere(r = 2, $fn = 16);

translate([32, -8, 18])
    sphere(r = 2, $fn = 16);

// Nose
translate([33, 0, 15])
    sphere(r = 1.5, $fn = 16);

// Mouth
translate([33, 0, 13])
    rotate([90, 0, 0])
    cylinder(h = 1, r = 3, $fn = 16);

// Whiskers
translate([33, 2, 13])
    rotate([0, 90, 0])
    cylinder(h = 6, r = 0.2, $fn = 8);

translate([33, -2, 13])
    rotate([0, 90, 0])
    cylinder(h = 6, r = 0.2, $fn = 8);