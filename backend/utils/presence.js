
const activeChatByUser = new Map(); 

function setActiveChat(userId, chatId) {
  if (userId) activeChatByUser.set(userId, chatId);
}

function clearActiveChat(userId, chatId) {
  if (userId && activeChatByUser.get(userId) === chatId) {
    activeChatByUser.delete(userId);
  }
}

function isViewingChat(userId, chatId) {
  return activeChatByUser.get(userId) === chatId;
}

module.exports = {
  activeChatByUser,
  setActiveChat,
  clearActiveChat,
  isViewingChat,
};
