import React, { Component } from "react";
import { View, Text, ActivityIndicator, Platform ,StyleSheet,ImageBackground} from "react-native";
import firebase from "firebase";
import "firebase/firestore";
import { inject } from "mobx-react/native";
import {colors} from "../../colors/colors";


if (Platform.OS !== "web") {
  window = undefined;
}

@inject("mainStore")
export default class AuthLoading extends Component {
  /* 
  This function checks if the user is registered or a first time user.In the former case,
  it returns user data, else it returns false.
  */
  _isRegistered(uid) {
    const db = firebase.firestore();
    const thisRef = this.props;
    const userRef = db.collection("users").doc(uid);
    var flag = false;
    userRef
      .get()
      .then(function(doc) {
        if (doc.exists) {
          console.log("exists");
          flag = true;
        } else {
          flag = false;
        }
      })
      .catch(function(error) {
        console.log(error);
      });
    return flag;
  }

  /*
  This functions fetches notifications from database and stores notifications in mainStore.notifications
  */

  _syncNotifications = uid => {
    const db = firebase.firestore();
    const thisRef = this.props;
    const thisPureRef = this;
    db.collection("notifications")
      .doc(uid)
      .collection("notifs")
      .onSnapshot(function(snap) {
        if (snap) {
          console.log("WOOAHH");
          const notifArray = [];
          snap.forEach(function(doc) {
            notifArray.push(doc.data());
          });
          thisRef.mainStore.setNotifications(
            notifArray.sort(function(x, y) {
              return y.timestamp - x.timestamp;
            })
          );
        }
      });
  };

  
  componentDidMount() {
    const db = firebase.firestore();
    const rootRef = this.props.navigation;
    const storeRef = this.props;
    const thisRef = this;
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        const uid = user.uid;
        const userRef = db.collection("users").doc(uid);
        storeRef.mainStore.setUid(uid);
        thisRef._syncNotifications(uid);
        userRef
          .get()
          .then(function(userData) {
            if (userData.exists) {
              userRef.onSnapshot(function(snap) {
                storeRef.mainStore.setUser(snap.data());
              });
              rootRef.navigate("App");
            } else {
              rootRef.navigate("Register");
            }
          })
          .catch(function(error) {
            console.log(error);
          });
      } else {
        rootRef.navigate("Auth");
      }
    });
  }


  render() {
    return (
      <ImageBackground source={require('../../assets/images/doodles/doodles.png')} style={styles.container}>
        <Text style={styles.text}>
          Signing you in...
          </Text>
          <View style={styles.indicator}>
              <ActivityIndicator color={colors.primary} />
          </View>
      </ImageBackground>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 23,
    justifyContent: "center"
  },
  text: {
    fontFamily: "Rubik-Bold",
    fontSize: 15,
    textAlign: "center"
  },
  indicator : {
    padding : 20,
    justifyContent : 'center',
    alignItems : 'center'
  }
});
