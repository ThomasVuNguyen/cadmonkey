// Simple cat made from basic OpenSCAD primitives
// Head
translate([0, 0, 10])
sphere(d = 12, $fn = 32);
// Ears
translate([-5, 0, 16])
rotate([0, -30, 0])
cylinder(h = 6, d1 = 5, d2 = 0, $fn = 8);
translate([5, 0, 16])
rotate([0, 30, 0])
cylinder(h = 6, d1 = 5, d2 = 0, $fn = 8);
// Body
translate([0, 0, 0])
sphere(d = 20, $fn = 32);
// Legs
translate([-6, 0, -8])
cylinder(h = 8, d = 4, $fn = 16);
translate([6, 0, -8])
cylinder(h = 8, d = 4, $fn = 16);
translate([-6, 0, 8])
cylinder(h = 8, d = 4, $fn = 16);
translate([6, 0, 8])
cylinder(h = 8, d = 4, $fn = 16);
// Tail
translate([10, 0, -2])
rotate([0, 90, 0])
