const Poll = require('../models/Poll');
const Vote = require('../models/Vote');
const { getOrCreateDeviceId } = require('../utils/deviceId');
const { generateCode } = require('../utils/codeGenerator');

/**
 * Create a new poll
 */
exports.createPoll = async (req, res) => {
  try {
    const { name, question, answers, multipleChoices, duration } = req.body;

    let code;
    let codeExists = true;
    let attempts = 0;

    while (codeExists && attempts < 10) {
      code = generateCode();
      const existingPoll = await Poll.findOne({ code });
      codeExists = !!existingPoll;
      attempts++;
    }

    if (codeExists) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate unique poll code',
      });
    }

    // Calculate validTill based on duration
    const validTill = new Date();
    validTill.setHours(validTill.getHours() + (duration || 24));

    const poll = new Poll({
      name,
      question,
      answers,
      multipleChoices: multipleChoices || false,
      validTill,
      code,
    });

    await poll.save();

    res.status(201).json({
      success: true,
      data: poll.toPublic(),
    });
  } catch (error) {
    console.error('[POLL] Create error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create poll',
    });
  }
};

/**
 * Get poll by code
 */
exports.getPollByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const poll = await Poll.findOne({ code });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    const votes = await Vote.find({ pollId: poll._id });
    const voteCounts = poll.answers.map(
      (_, index) => votes.filter((vote) => vote.selected.includes(index)).length
    );

    const totalVotes = votes.length;

    const deviceId = getOrCreateDeviceId(req, res);
    const userVote = await Vote.findOne({ pollId: poll._id, deviceId });

    res.json({
      success: true,
      data: {
        ...poll.toPublic(),
        voteCounts,
        totalVotes,
        userVote: userVote ? userVote.selected : null,
      },
    });
  } catch (error) {
    console.error('[POLL] Get by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch poll',
    });
  }
};

/**
 * Submit a vote
 */
exports.submitVote = async (req, res) => {
  try {
    const { code } = req.params;
    const { selected } = req.body;

    const poll = await Poll.findOne({ code });
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    if (!poll.isActive()) {
      return res.status(400).json({
        success: false,
        message: 'This poll has expired',
      });
    }

    if (!Array.isArray(selected) || selected.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one answer must be selected',
      });
    }

    if (!poll.multipleChoices && selected.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'This poll does not allow multiple choices',
      });
    }

    const invalidIndices = selected.filter(
      (index) => index < 0 || index >= poll.answers.length
    );

    if (invalidIndices.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answer selection',
      });
    }

    if (selected.length !== new Set(selected).size) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate selections are not allowed',
      });
    }

    const deviceId = getOrCreateDeviceId(req, res);

    console.log('Submitting vote for Device ID:', deviceId);

    const existingVote = await Vote.findOne({ pollId: poll._id, deviceId });
    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this poll',
      });
    }

    const vote = new Vote({
      pollId: poll._id,
      deviceId,
      selected,
    });

    await vote.save();

    const votes = await Vote.find({ pollId: poll._id });
    const voteCounts = poll.answers.map(
      (_, index) => votes.filter((vote) => vote.selected.includes(index)).length
    );

    const totalVotes = votes.length;

    if (global._io) {
      global._io.to(`poll_${code}`).emit('voteUpdate', {
        pollId: poll._id,
        code: poll.code,
        voteCounts,
        totalVotes,
        selected,
        deviceId,
      });
    }

    res.json({
      success: true,
      data: {
        vote: vote.toPublic(),
        voteCounts,
        totalVotes,
      },
    });
  } catch (error) {
    console.error('[POLL] Vote error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit vote',
    });
  }
};

/**
 * Get poll results (without user's vote info)
 */
exports.getPollResults = async (req, res) => {
  try {
    const { code } = req.params;
    const poll = await Poll.findOne({ code });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found',
      });
    }

    const votes = await Vote.find({ pollId: poll._id });
    const voteCounts = poll.answers.map(
      (_, index) => votes.filter((vote) => vote.selected.includes(index)).length
    );

    const totalVotes = votes.length;

    res.json({
      success: true,
      data: {
        ...poll.toPublic(),
        voteCounts,
        totalVotes,
      },
    });
  } catch (error) {
    console.error('[POLL] Results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch poll results',
    });
  }
};
