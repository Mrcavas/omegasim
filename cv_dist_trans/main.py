import cv2 
import numpy as np 

# Load the input image and make it grayscale. 
img = cv2.imread('line_data.png', cv2.IMREAD_UNCHANGED)
img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) 

_, gray = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY) 

# img = cv2.distanceTransform(img, cv2.DIST_L2, 0) 

# _, img = cv2.threshold(img, 15, 255, cv2.THRESH_TRUNC)

# img = cv2.normalize(img, None, 127, 255, cv2.NORM_MINMAX, dtype=cv2.CV_32F) 

# img = np.dstack((img, img, img, np.full(img.shape, 255, img.dtype)))

# normal = cv2.bitwise_and(img, img, mask=gray)

inv = cv2.bitwise_not(gray) 

# _, img = cv2.threshold(inv, 127, 255, cv2.THRESH_BINARY) 

# img = cv2.distanceTransform(inv, cv2.DIST_L2, 0) 

# _, img = cv2.threshold(img, 15, 255, cv2.THRESH_TRUNC)

# img = img * -1

# img = cv2.normalize(img, None, 0, 127, cv2.NORM_MINMAX, dtype=cv2.CV_32F) 

# img = np.dstack((img, img, img, np.full(img.shape, 255, img.dtype)))

# img = cv2.bitwise_and(img, img, mask=inv)

# img = cv2.bitwise_or(img, normal)
# gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY) 
# img = 255 - gray

cv2.imwrite('line.png', inv) 

