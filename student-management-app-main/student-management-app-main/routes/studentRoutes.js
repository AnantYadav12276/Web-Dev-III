const express = require("express");

const router = express.Router();

const students = require("../data/students");

// GET /students
router.get("/", (req, res) => {

    res.status(200).json({
        success: true,
        data: students
    });

});



router.get("/:id", (req, res) => {

    const id = Number(req.params.id);

    const student = students.find(student => student.id === id);

    if (!student) {
        return res.status(404).json({
            success: false,
            message: "Student not found"
        });
    }

    res.status(200).json({
        success: true,
        data: student
    });

});



router.post("/", (req, res) => {

    const { name, course } = req.body;

    if (!name || !course) {
        return res.status(400).json({
            success: false,
            message: "Name and course are required"
        });
    }

    const newId = students.length > 0
        ? Math.max(...students.map(student => student.id)) + 1
        : 1;

    const newStudent = {
        id: newId,
        name: name,
        course: course
    };

    students.push(newStudent);

    res.status(201).json({
        success: true,
        message: "Student created successfully",
        data: newStudent
    });

});



router.put("/:id", (req, res) => {

    const id = Number(req.params.id);

    const student = students.find(student => student.id === id);

    if (!student) {
        return res.status(404).json({
            success: false,
            message: "Student not found"
        });
    }

    const { name, course } = req.body;

    if (!name || !course) {
        return res.status(400).json({
            success: false,
            message: "Name and course are required"
        });
    }

    student.name = name;
    student.course = course;

    res.status(200).json({
        success: true,
        message: "Student updated successfully",
        data: student
    });

});



router.delete("/:id", (req, res) => {

    const id = Number(req.params.id);

    const index = students.findIndex(student => student.id === id);

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: "Student not found"
        });
    }

    const deletedStudent = students.splice(index, 1);

    res.status(200).json({
        success: true,
        message: "Student deleted successfully",
        data: deletedStudent[0]
    });

});


module.exports = router;