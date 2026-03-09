import api from './index'

export const getHomeBanners = () => {
  return api.get('/banner-images/home')
}

export const getCategoryBanners = (categoryId) => {
  return api.get(`/banner-images/category/${categoryId}`)
}

export const getBackgroundImage = () => {
  return api.get('/banner-images/background')
}

export const getUserProfileBackground = () => {
  return api.get('/banner-images/user-profile')
}
