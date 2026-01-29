import { call, put, takeEvery, takeLatest } from "redux-saga/effects";

// Login Redux States
import { LOGIN_USER, LOGOUT_USER, SOCIAL_LOGIN } from "./actionTypes";
import { apiError, loginSuccess, logoutUserSuccess } from "./actions";

//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import { postSocialLogin } from "../../../helpers/fakebackend_helper";
import axiosInstance from "../../../services/axiosService";

const fireBaseBackend = getFirebaseBackend();

function* loginUser({ payload: { user, history } }) {
  try {
    if (import.meta.env.VITE_APP_DEFAULTAUTH === "firebase") {
      const response = yield call(
        fireBaseBackend.loginUser,
        user.email,
        user.password
      );
      yield put(loginSuccess(response));
    } else {
      // Real backend login (username/password)
      const username = user.username || user.email; // fallback for older form field name
      const { data } = yield call([axiosInstance, axiosInstance.post], "v1/auth/login", {
        username,
        password: user.password,
      });
      const payload = data?.data ?? data;

      // Keep the shape expected by Authmiddleware + ProfileMenu
      const authUser = {
        accessToken: payload.accessToken,
        username: payload.username || payload.user?.username || username,
        user: payload.user,
      };

      localStorage.setItem("authUser", JSON.stringify(authUser));
      yield put(loginSuccess(authUser));
    }
    history('/buildings-list');
  } catch (error) {
    const msg =
      error?.response?.data?.error ||
      error?.message ||
      "Login failed";
    yield put(apiError(msg));
  }
}

function* logoutUser({ payload: { history } }) {
  try {
    localStorage.removeItem("authUser");

    if (import.meta.env.VITE_APP_DEFAULTAUTH === "firebase") {
      const response = yield call(fireBaseBackend.logout);
      yield put(logoutUserSuccess(response));
    }
    history('/login');
  } catch (error) {
    yield put(apiError(error));
  }
}

function* socialLogin({ payload: { type, history } }) {
  try {
    if (import.meta.env.VITE_APP_DEFAULTAUTH === "firebase") {
      const fireBaseBackend = getFirebaseBackend();
      const response = yield call(fireBaseBackend.socialLoginUser, type);
      if (response) {
        history("/buildings-list");
      } else {
        history("/login");
      }
      localStorage.setItem("authUser", JSON.stringify(response));
      yield put(loginSuccess(response));
      if(response)
      history("/buildings-list");
    }
  } catch (error) {
    yield put(apiError(error));
  }
}

function* authSaga() {
  yield takeEvery(LOGIN_USER, loginUser);
  yield takeLatest(SOCIAL_LOGIN, socialLogin);
  yield takeEvery(LOGOUT_USER, logoutUser);
}

export default authSaga;
