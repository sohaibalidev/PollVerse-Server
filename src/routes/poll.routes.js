const express = require('express');
const router = express.Router();
const pollController = require('../controllers/poll.controller');

/**
 * @route   POST /api/polls
 * @desc    Create a new poll
 * @access  Public
 */
router.post('/polls', pollController.createPoll);

/**
 * @route   GET /api/polls/:code
 * @desc    Get poll by code (includes user vote info if available)
 * @access  Public
 */
router.get('/polls/:code', pollController.getPollByCode);

/**
 * @route   POST /api/polls/:code/vote
 * @desc    Submit a vote for a poll
 * @access  Public
 */
router.post('/polls/:code/vote', pollController.submitVote);

/**
 * @route   GET /api/polls/:code/results
 * @desc    Get poll results (public view without user vote info)
 * @access  Public
 */
router.get('/polls/:code/results', pollController.getPollResults);

module.exports = router;
