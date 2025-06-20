import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Wishlist deve pertencer a um usuário'],
      index: true,
    },
    sneakers: [
      {
        sneaker: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Sneaker',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

wishlistSchema.methods.addSneaker = async function (sneakerId) {
  const exists = this.sneakers.some(
    (item) => item.sneaker.toString() === sneakerId.toString()
  );

  if (!exists) {
    this.sneakers.push({ sneaker: sneakerId });
    return this.save();
  }

  return this;
};

wishlistSchema.methods.removeSneaker = async function (sneakerId) {
  this.sneakers = this.sneakers.filter(
    (item) => item.sneaker.toString() !== sneakerId.toString()
  );

  return this.save();
};

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;
