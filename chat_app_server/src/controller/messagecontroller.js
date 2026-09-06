import Message from '../publickey/message.js';

export const getMessageHistory = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const { receiverId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    }).sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

export const saveMessage = async (req, res, next) => {
  try {
    const sender = req.user.id;
    const { receiverId, ciphertext, iv } = req.body;

    const message = await Message.create({
      sender,
      receiver: receiverId,
      ciphertext,
      iv
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};