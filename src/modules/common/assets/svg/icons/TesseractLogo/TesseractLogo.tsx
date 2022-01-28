import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const TesseractLogo: React.FC<Props> = ({ width = 115, height = 54, ...rest }) => (
  <Svg width={width} height={height} viewBox="0 0 122 66" {...rest}>
    <Path
      d="M21.6077 5.18574C21.5943 5.18731 21.5809 5.18945 21.5677 5.19215C21.5014 5.19943 21.4375 5.2204 21.3798 5.25375C21.3221 5.2871 21.272 5.33209 21.2327 5.38586L4.38517 22.2334C4.29961 22.296 4.23719 22.3852 4.20767 22.487C4.2049 22.4961 4.2024 22.5053 4.20018 22.5146C4.18366 22.58 4.18111 22.6481 4.19269 22.7146V43.3021C4.17653 43.3948 4.18793 43.4901 4.22549 43.5763C4.26304 43.6626 4.3251 43.7359 4.40394 43.7871L21.2177 60.6021C21.2625 60.6698 21.3237 60.725 21.3956 60.7626C21.4675 60.8002 21.5478 60.819 21.6289 60.8172C21.6574 60.8171 21.6859 60.8145 21.7139 60.8094H42.2852C42.3169 60.8152 42.3492 60.8178 42.3814 60.8172C42.4619 60.8175 42.5411 60.7976 42.6119 60.7594C42.6826 60.7212 42.7427 60.6658 42.7864 60.5983L59.6439 43.7408C59.6526 43.7332 59.6609 43.7253 59.669 43.7172C59.6703 43.715 59.6715 43.7129 59.6728 43.7107C59.6745 43.7086 59.6762 43.7065 59.6779 43.7043C59.6797 43.7022 59.6814 43.7001 59.6831 43.6979C59.6895 43.6915 59.6957 43.6849 59.7018 43.6781C59.7031 43.676 59.7044 43.6739 59.7056 43.6717C59.7069 43.6696 59.7082 43.6675 59.7095 43.6653C59.7497 43.6147 59.7793 43.5565 59.7965 43.4943C59.8136 43.432 59.8181 43.3669 59.8095 43.3028V22.6815C59.8215 22.5948 59.8095 22.5065 59.7749 22.4261C59.7404 22.3456 59.6844 22.2762 59.6132 22.2253L42.7689 5.38023C42.7233 5.31757 42.6632 5.26689 42.5938 5.2325C42.5244 5.19811 42.4476 5.18103 42.3702 5.18273C42.3693 5.18273 42.3685 5.18273 42.3676 5.18273C42.3651 5.18271 42.3626 5.18271 42.3601 5.18273C42.3425 5.1839 42.325 5.18604 42.3076 5.18914H21.6989C21.6737 5.18498 21.6482 5.18283 21.6226 5.18273C21.6201 5.18271 21.6177 5.18271 21.6152 5.18273C21.6127 5.18271 21.6102 5.18271 21.6077 5.18273V5.18574ZM22.7839 6.15074H41.2177L32.0002 15.3682L22.7839 6.15074ZM22.1039 6.82824L31.3214 16.047L25.2264 22.142H22.1039V6.82824ZM42.8564 6.82824L58.1689 22.142H42.8564V6.82824ZM21.1439 6.82824V22.1407H5.83142L21.1439 6.82824ZM41.8964 6.82824V22.1407H38.7739L32.6789 16.0458L41.8964 6.82824ZM32.0014 16.7233L37.8977 22.6207L34.5764 25.942H29.4239L26.1027 22.622L32.0014 16.7233ZM5.83017 23.1007H21.1439V26.2245L15.0489 32.3195L5.83017 23.1007ZM22.1039 23.1007H24.9452V25.942H22.1039V23.1007ZM39.0564 23.1007H41.8964V25.942H39.0564V23.1007ZM42.8564 23.1007H58.1702L48.9527 32.3182L42.8564 26.2232V23.1007ZM38.0964 23.7795V25.942H35.9339L38.0964 23.7795ZM5.15267 23.7795L14.3702 32.997L5.15267 42.2133V23.7795ZM25.9052 23.7795L28.0664 25.9407H25.9052V23.7795ZM58.8489 23.7795V42.2133L49.6314 32.997L58.8489 23.7795ZM22.7827 26.9007H24.9452V29.0632L22.7827 26.9007ZM25.9052 26.9007H29.0264L31.3214 29.1957L28.1989 32.317L25.9052 30.0232V26.9007ZM30.3839 26.9007H33.6164L32.0002 28.517L30.3839 26.9007ZM34.9739 26.9007H38.0964V30.0232L35.8014 32.3182L32.6789 29.1957L34.9739 26.9007ZM39.0564 26.9007H41.2189L39.0564 29.0632V26.9007ZM21.6252 27.0995L24.9452 30.4195V35.572L21.6239 38.8933L15.7277 32.997L21.6252 27.0995ZM42.3764 27.0995L48.2739 32.997L42.3764 38.892L39.0564 35.572V30.4207L42.3764 27.0995ZM32.0002 29.8745L35.1227 32.997L32.0002 36.1182L28.8789 32.997L32.0002 29.8745ZM25.9052 31.3795L27.5214 32.9957L25.9052 34.612V31.3795ZM38.0964 31.3795V34.6108L36.4802 32.9945L38.0964 31.3795ZM28.2002 33.6732L31.3214 36.7957L29.0264 39.0908H25.9052V35.9695L28.2002 33.6732ZM15.0489 33.6732L21.1439 39.7683V42.8908H5.83017L15.0489 33.6732ZM35.8014 33.6732L38.0964 35.9683V39.0895H34.9739L32.6789 36.7945L35.8014 33.6732ZM48.9527 33.6732L58.1702 42.8908H42.8564V39.7695L48.9527 33.6732ZM24.9452 36.9283V39.0895H22.7839L24.9452 36.9283ZM39.0564 36.9283L41.2177 39.0895H39.0564V36.9283ZM32.0002 37.4732L33.6164 39.0895H30.3839L32.0002 37.4732ZM22.1039 40.0495H24.9452V42.8908H22.1039V40.0495ZM25.9052 40.0495H28.0664L25.9052 42.2108V40.0495ZM29.4239 40.0495H34.5764L37.8977 43.3708L32.0002 49.267L26.1039 43.3708L29.4239 40.0495ZM35.9339 40.0495H38.0964V42.212L35.9339 40.0495ZM39.0564 40.0495H41.8964V42.8908H39.0564V40.0495ZM5.83142 43.8508H21.1439V59.1633L5.83142 43.8508ZM22.1039 43.8508H25.2264L31.3214 49.9457L22.1039 59.1645V43.8508ZM38.7739 43.8508H41.8964V59.1633L32.6789 49.9457L38.7739 43.8508ZM42.8564 43.8508H58.1689L42.8564 59.1645V43.8508ZM32.0002 50.6246L41.2177 59.842H22.7839L32.0002 50.6246Z"
      fill="white"
    />
    <Path
      d="M81.613 27.174C81.0137 27.174 80.714 26.8647 80.714 26.246V8.15H73.783C73.203 8.15 72.913 7.87933 72.913 7.338C72.913 6.816 73.203 6.555 73.783 6.555H89.472C90.0327 6.555 90.313 6.816 90.313 7.338C90.313 7.87933 90.0327 8.15 89.472 8.15H82.512V26.246C82.512 26.8647 82.2123 27.174 81.613 27.174Z"
      fill="#FDFFFF"
    />
    <Path
      d="M100.654 27C99.9967 27 99.668 26.6617 99.668 25.985V7.57C99.668 6.89333 99.9967 6.555 100.654 6.555H111.616C112.157 6.555 112.428 6.80633 112.428 7.309C112.428 7.831 112.157 8.092 111.616 8.092H101.408V15.864H111.036C111.577 15.864 111.848 16.1153 111.848 16.618C111.848 17.14 111.577 17.401 111.036 17.401H101.408V25.463H111.616C112.157 25.463 112.428 25.7143 112.428 26.217C112.428 26.739 112.157 27 111.616 27H100.654Z"
      fill="#FDFFFF"
    />
    <Path
      d="M82.048 60.232C79.1287 60.232 76.7507 59.5263 74.914 58.115C74.5853 57.883 74.4307 57.6123 74.45 57.303C74.4887 56.9743 74.6337 56.7327 74.885 56.578C75.1363 56.4233 75.4263 56.462 75.755 56.694C76.6443 57.3707 77.582 57.8637 78.568 58.173C79.5733 58.463 80.7333 58.608 82.048 58.608C83.8847 58.608 85.2573 58.2503 86.166 57.535C87.094 56.8197 87.558 55.882 87.558 54.722C87.558 53.7553 87.2197 53.0013 86.543 52.46C85.8857 51.9187 84.7933 51.4933 83.266 51.184L80.337 50.575C78.5197 50.2077 77.1567 49.589 76.248 48.719C75.3587 47.849 74.914 46.689 74.914 45.239C74.914 44.0597 75.2137 43.0253 75.813 42.136C76.4317 41.2467 77.2823 40.5603 78.365 40.077C79.4477 39.5743 80.6947 39.323 82.106 39.323C83.3627 39.323 84.513 39.497 85.557 39.845C86.6203 40.193 87.587 40.744 88.457 41.498C88.747 41.73 88.8727 42.0007 88.834 42.31C88.7953 42.6193 88.6503 42.8513 88.399 43.006C88.167 43.1413 87.8867 43.0833 87.558 42.832C86.746 42.1747 85.8953 41.701 85.006 41.411C84.1167 41.1017 83.15 40.947 82.106 40.947C80.482 40.947 79.177 41.3337 78.191 42.107C77.2243 42.8803 76.741 43.9147 76.741 45.21C76.741 46.2347 77.0503 47.0467 77.669 47.646C78.2877 48.226 79.2833 48.6513 80.656 48.922L83.614 49.531C85.5667 49.937 87.0167 50.546 87.964 51.358C88.9113 52.1507 89.385 53.243 89.385 54.635C89.385 55.737 89.0853 56.7133 88.486 57.564C87.906 58.3953 87.065 59.0527 85.963 59.536C84.861 60 83.556 60.232 82.048 60.232Z"
      fill="#FDFFFF"
    />
    <Path
      d="M100.538 60.174C99.958 60.174 99.668 59.8647 99.668 59.246V40.483C99.668 39.8643 99.9677 39.555 100.567 39.555H107.382C109.567 39.555 111.229 40.0577 112.37 41.063C113.53 42.0683 114.11 43.499 114.11 45.355C114.11 46.8823 113.694 48.1197 112.863 49.067C112.032 50.0143 110.852 50.6233 109.325 50.894C110.156 51.2033 110.891 51.9573 111.529 53.156L114.603 58.869C114.777 59.1977 114.806 59.4973 114.69 59.768C114.593 60.0387 114.381 60.174 114.052 60.174C113.588 60.174 113.24 59.9517 113.008 59.507L109.76 53.446C109.257 52.5373 108.697 51.9283 108.078 51.619C107.459 51.3097 106.628 51.155 105.584 51.155H101.437V59.246C101.437 59.8647 101.137 60.174 100.538 60.174ZM101.437 49.647H107.15C110.591 49.647 112.312 48.2163 112.312 45.355C112.312 42.513 110.591 41.092 107.15 41.092H101.437V49.647Z"
      fill="#FDFFFF"
    />
  </Svg>
)

export default TesseractLogo
