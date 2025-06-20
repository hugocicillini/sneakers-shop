import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sneaker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sneaker',
      required: true,
    },
    comment: {
      type: String,
      required: true,
      maxLength: 500,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ sneaker: 1, date: -1 });
reviewSchema.index({ user: 1, sneaker: 1 });

reviewSchema.post('save', async function () {
  try {
    const Sneaker = mongoose.model('Sneaker');
    const sneaker = await Sneaker.findById(this.sneaker);

    if (sneaker) {
      await sneaker.updateRatingInfo();
      await sneaker.save();
    }
  } catch (error) {
    console.error('Erro ao atualizar média de avaliações:', error);
  }
});

reviewSchema.post('remove', async function () {
  try {
    const Sneaker = mongoose.model('Sneaker');
    const sneaker = await Sneaker.findById(this.sneaker);

    if (sneaker) {
      await sneaker.updateRatingInfo();
      await sneaker.save();
    }
  } catch (error) {
    console.error(
      'Erro ao atualizar média de avaliações após exclusão:',
      error
    );
  }
});

const Review = mongoose.model('Review', reviewSchema);
export { Review };
