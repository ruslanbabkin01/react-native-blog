import { useState, useEffect } from 'react'
import { SimpleLineIcons, AntDesign } from '@expo/vector-icons'
import { nanoid } from 'nanoid'
import 'react-native-get-random-values'
import * as Location from 'expo-location'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
} from 'react-native'
import { colors } from '../../helpers/colors'
import PhotoCamera from '../../components/PhotoCamera'
import { useSelector } from 'react-redux'
import { collection, addDoc } from 'firebase/firestore'
import { uploadPhotoToServer } from '../../helpers/uploadPhotoToServer'
import { selectAuth } from '../../redux/auth/selectors'
import { firestore } from '../../firebase/config'
import Loader from '../../components/Loader'

const initialState = {
  title: '',
  location: '',
  coords: null,
}

export default function CreatePostsScreen({ navigation }) {
  const [state, setState] = useState(initialState)
  const [activeInput, setActiveInput] = useState('')
  const [isShowKeyboard, setIsShowKeyboard] = useState(false)
  const [cameraRef, setCameraRef] = useState(null)
  const [takenPhoto, setTakenPhoto] = useState(null)
  const { userId, nickName, userPhoto, userEmail, isLoading, error } =
    useSelector(selectAuth)

  useEffect(() => {
    ;(async () => {
      //запит на дозвіл використання геолокації
      let { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        console.log('Permission to access location was denied')
        return
      }
    })()
  }, [])

  const takePhoto = async () => {
    const { uri } = await cameraRef.takePictureAsync()
    const location = await Location.getCurrentPositionAsync()
    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    }
    setState(prevState => ({
      ...prevState,
      coords: coords,
    }))
    setTakenPhoto(uri)
  }

  const uploadPostToServer = async () => {
    const photoUrl = await uploadPhotoToServer(takenPhoto, 'postsImages')
    try {
      const docRef = await addDoc(collection(firestore, 'posts'), {
        ...state,
        photo: photoUrl,
        userId,
        nickName,
        userPhoto,
        userEmail,
        commentsNumber: 0,
        likesValue: 0,
        likes: [],
        isLiked: false,
      })
      console.log('document id: ', docRef.id)
    } catch (e) {
      console.error('Error adding document: ', e.message)
    }
  }

  const inputValueHandler = (input, value) => {
    setState(prevState => ({
      ...prevState,
      [input]: value,
      id: nanoid(10),
    }))
  }

  const activeInputHandler = inputName => {
    setIsShowKeyboard(true)
    setActiveInput(inputName)
  }

  const showKeyboardHandler = () => {
    setIsShowKeyboard(false)
    setActiveInput('')
    Keyboard.dismiss()
  }

  const submitHandler = async () => {
    uploadPostToServer()
    navigation.navigate('DefaultScreen')
    setState(initialState)
    setTakenPhoto(null)
  }

  return (
    <TouchableWithoutFeedback onPress={showKeyboardHandler}>
      <View style={styles.container}>
        {isLoading && <Loader />}
        {error && <Text>{error.message}</Text>}
        <View style={styles.photoContainer}>
          {takenPhoto ? (
            <Image
              style={styles.photo}
              onPress={Keyboard.dismiss}
              source={{ uri: takenPhoto }}
            />
          ) : (
            <PhotoCamera newPhoto={takePhoto} camera={setCameraRef} />
          )}
        </View>

        <TouchableOpacity>
          {takenPhoto ? (
            <Text onPress={() => setTakenPhoto(null)} style={styles.subTitle}>
              Change photo
            </Text>
          ) : (
            <Text style={styles.subTitle}>Upload photo</Text>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          <TextInput
            style={{
              ...styles.input,
              borderColor:
                activeInput === 'title' ? colors.orange : colors.textColor,
            }}
            placeholder='Title...'
            placeholderTextColor={colors.textColor}
            value={state.title}
            onChangeText={value => inputValueHandler('title', value)}
            onFocus={() => activeInputHandler('title')}
            onEndEditing={() => showKeyboardHandler()}
          />

          <View>
            <TextInput
              style={{
                ...styles.input,
                paddingLeft: 24,
                borderColor:
                  activeInput === 'location' ? colors.orange : colors.textColor,
              }}
              placeholder='Location...'
              placeholderTextColor={colors.textColor}
              value={state.location}
              onChangeText={value => inputValueHandler('location', value)}
              onFocus={() => activeInputHandler('location')}
            />
            <SimpleLineIcons
              name='location-pin'
              size={24}
              color={colors.textColor}
              style={styles.locationIcon}
            />
          </View>

          <TouchableOpacity
            style={{
              ...styles.button,
              backgroundColor: takenPhoto ? colors.orange : colors.background,
            }}
            onPress={submitHandler}
          >
            <Text
              style={{
                ...styles.buttonText,
                color: takenPhoto ? colors.white : colors.textColor,
              }}
            >
              Publish
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => {
            setState(initialState)
            setTakenPhoto(null)
          }}
        >
          <AntDesign name='delete' size={24} color={colors.textColor} />
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  photoContainer: {
    marginHorizontal: 16,
    height: 240,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderColor: colors.borderColor,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderRadius: 8,
  },
  subTitle: {
    color: colors.textColor,
    fontSize: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  form: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  input: {
    marginTop: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    fontSize: 16,
    color: colors.black,
  },
  locationIcon: {
    position: 'absolute',
    bottom: 22,
    left: -5,
  },
  button: {
    borderRadius: 100,
    padding: 16,
    marginTop: 32,
    justifyContent: 'center',
    alignItems: 'center',
    color: colors.black,
  },
  buttonText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
  },
  deleteBtn: {
    alignSelf: 'center',
    width: 70,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 120,
  },
})
