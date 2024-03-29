import { updateProfile } from 'firebase/auth'
import { auth } from '../firebase/config'

export const removeUserPhoto = async () => {
  try {
    await updateProfile(auth.currentUser, {
      photoURL: '',
    })
    console.log('avatar removed')
  } catch (error) {
    console.log('error.message', error.message)
  }
}
