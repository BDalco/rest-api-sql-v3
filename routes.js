'use strict';

const express = require('express');

// Construct a router instance.
const router = express.Router();
const { User, Course } = require('./models');
const { authenticateUser } = require('./middleware/userAuth');
const { asyncHandler } = require('./middleware/asyncHandler');

// Route that returns properties of the user.
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
  const user = await req.currentUser;
  res.status(200).json({ id: user.id, firstName: user.firstName, lastName: user.lastName, emailAddress: user.emailAddress });
}));

// Route that creates a new user.
router.post('/users', asyncHandler(async (req, res) => {
  try {
    await User.create(req.body);
    res.location('/').status(201).end();
  } catch (error) {
    console.log('ERROR: ', error.name);

    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });   
    } else {
      throw error;
    }
  }
}));

// Route that returns a list of courses.
router.get('/courses', asyncHandler(async (req, res) => {
  const courses = await Course.findAll({
    include: [{
      model: User,
      as: 'owner',
      attributes: ['id', 'firstName', 'lastName', 'emailAddress']
    }]
  });
  res.status(200).json(courses);
}));

// Route that returns a course by id.
router.get('/courses/:id', asyncHandler(async (req, res) => {
  let courseId = req.params.id;
  const course = await Course.findByPk(courseId, {
    include: [{
      model: User,
      as: 'owner'
    }]
  });
  res.status(200).json(course);
}));

// Route that creates a new course
router.post('/courses', authenticateUser, asyncHandler(async (req, res) => {
  try {
    let course = await Course.create({
      title: req.body.title,
      description: req.body.description,
      userId: req.body.userId
    });
    res.status(201).location(`courses/${course.id}`).end();
  } catch (error) {
    console.log('ERROR: ', error.name);

    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });   
    } else {
      throw error;
    }
  }
}));

// Route that updates a course by ID
router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
  try {
    let courseId = req.params.id;
    const course = await Course.findByPk(courseId);
    await course.update({
      title: req.body.title,
      description: req.body.description,
      userId: req.body.userId
    })
    res.status(204).end();
  } catch (error) {
    console.log('ERROR: ', error.name);

    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });   
    } else {
      throw error;
    }
  }
}));

// Route that deletes a course by ID
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
  let courseId = req.params.id;
  const course = await Course.findByPk(courseId);
  await course.destroy();
  res.status(204).end();
}));

module.exports = router;