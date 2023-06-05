import {
  doc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { firestore } from '../firebase/config'

export const addLikeHandler = async (initPostsArray, postId, userId) => {
  const postsCollectionRef = doc(firestore, 'posts', postId)

  initPostsArray?.map(post => {
    if (!post.likes.includes(userId)) {
      updateDoc(postsCollectionRef, {
        likesNumber: increment(1),
        likes: arrayUnion(userId),
      })
    } else {
      updateDoc(postsCollectionRef, {
        likesNumber: increment(-1),
        likes: arrayRemove(userId),
      })
    }
  })
}
