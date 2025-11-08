const mongoose = require('mongoose');
const { Schema } = mongoose;

const pollSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, 'Name must be at least 3 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    question: {
      type: String,
      required: true,
      trim: true,
      minlength: [5, 'Question must be at least 5 characters long'],
      maxlength: [200, 'Question cannot exceed 200 characters'],
    },

    code: {
      type: String,
      required: true,
      unique: true,
      match: /^[a-zA-Z0-9]{8}$/,
      validate: {
        validator: (v) => /^[a-zA-Z0-9]{8}$/.test(v),
        message: 'Code must be exactly 8 alphanumeric characters',
      },
    },

    answers: {
      type: [String],
      required: true,
      validate: [
        {
          validator: (v) => Array.isArray(v) && v.length >= 2 && v.length <= 10,
          message: 'Poll must have between 2 and 10 answers',
        },
        {
          validator: (v) => v.every((a) => a.length >= 1 && a.length <= 50),
          message: 'Each answer must be between 1 and 50 characters long',
        },
      ],
    },

    multipleChoices: { type: Boolean, default: false },

    validTill: { type: Date },

    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 },
    },

    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

pollSchema.pre('save', function (next) {
  const oneDay = 24 * 60 * 60 * 1000;

  if (!this.createdAt) this.createdAt = new Date();
  if (!this.validTill)
    this.validTill = new Date(this.createdAt.getTime() + oneDay);
  if (!this.expiresAt)
    this.expiresAt = new Date(this.validTill.getTime() + oneDay);

  next();
});

pollSchema.methods.isActive = function () {
  return new Date() < this.validTill;
};

pollSchema.methods.toPublic = function () {
  return {
    id: this._id,
    code: this.code,
    name: this.name,
    question: this.question,
    answers: this.answers,
    multipleChoices: this.multipleChoices,
    validTill: this.validTill,
    expiresAt: this.expiresAt,
    isActive: this.isActive(),
  };
};

module.exports = mongoose.model('Poll', pollSchema);
