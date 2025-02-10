import * as React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const CheckIcon: React.FC<SvgProps> = ({ width = 25, height = 24, ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 25 24" fill="none" {...props}>
    <Path
      d="M12.5 2l.523.014.522.04.52.07.514.095.51.122.501.148.494.175.483.2.473.226.46.25.446.273.432.297.415.319.398.34.38.36.36.38.34.398.32.415.296.432.273.446.25.46.226.473.2.483.175.494.148.502.123.509.095.515.068.519.041.522.014.523-.014.523-.04.522-.07.52-.095.514-.122.51-.148.501-.175.494-.2.483-.226.473-.25.46-.273.446-.297.432-.319.415-.34.398-.36.38-.38.36-.398.34-.415.32-.432.296-.446.273-.46.25-.473.226-.483.2-.494.175-.502.148-.509.123-.515.095-.519.068-.522.041L12.5 22l-.523-.014-.522-.04-.52-.07-.514-.095-.51-.122-.501-.148-.494-.175-.483-.2-.473-.226-.46-.25-.446-.273-.432-.297-.415-.319-.398-.34-.38-.36-.36-.38-.34-.398-.32-.415-.296-.432L3.84 17l-.25-.46-.225-.473-.2-.483-.176-.494-.148-.502-.122-.509-.096-.515-.068-.519-.041-.522L2.5 12l.014-.523.04-.522.07-.52.095-.514.122-.51.148-.501.175-.494.2-.483.226-.473.25-.46.273-.446.297-.432.319-.415.34-.398.36-.38.38-.36.398-.34.415-.32.432-.296.446-.273.46-.25.473-.225.483-.2.494-.176.502-.148.509-.122.515-.096.519-.068.522-.041L12.5 2z"
      fill="#98BF39"
    />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.807 21.021c-4.555-3.127-7.542-8.372-7.542-14.315 0-1.497.19-2.95.546-4.335l.101-.03.51-.122.514-.096.519-.068.522-.041L12.5 2l.524.014.522.04.519.07.514.095.51.122.501.148.494.175.484.2.472.226.46.25.447.273.431.297.416.319.398.34.38.36.36.38.34.398.318.415.297.432.273.446.25.46.226.473.2.483.175.494.149.502.122.509.095.515.069.519.04.522.014.523-.013.523-.041.522-.069.52-.095.514-.122.51-.15.501-.174.494-.2.483-.226.473-.25.46-.273.446-.297.432-.318.415-.34.398-.36.38-.38.36-.398.34-.416.32-.431.296-.447.273-.46.25-.233.111z"
      fill="#B1D952"
    />
    <Path
      d="M12.526 1h-.052l-.524.014h-.026l-.026.003-.522.04-.026.003-.026.003-.519.069-.026.003-.026.005-.514.095-.026.005-.026.006-.509.122-.025.006-.025.008-.502.149-.025.007-.025.009-.493.175-.025.008-.024.01-.484.2-.024.01-.024.012-.472.225-.024.012-.023.012-.46.25L7 2.473l-.022.014-.447.274-.022.013-.022.015-.431.297-.022.015-.02.015-.416.32-.02.015-.02.017-.399.34-.02.017-.019.018-.38.36-.018.019-.018.019-.36.38-.019.018-.017.02-.34.398-.017.02-.016.021-.319.415-.015.021-.015.022-.297.431-.015.022-.013.022-.274.447-.014.022-.012.023-.25.46-.012.023-.012.024-.225.472-.011.024-.01.024-.2.484-.01.024-.01.025-.174.493-.009.025-.007.025-.15.502-.007.025-.006.025-.122.51-.006.025-.005.026-.095.514-.005.026-.003.026-.069.52-.003.025-.002.026-.041.522-.002.026-.001.027-.014.523v.052l.014.524v.026l.003.026.04.522.003.026.003.026.069.519.003.026.005.026.095.514.005.026.006.026.122.509.006.025.008.025.149.502.007.025.009.025.175.494.008.024.01.024.2.484.01.024.012.024.225.472.012.024.012.023.25.46.012.023.014.023.274.446.013.022.015.022.297.431.015.022.015.02.32.416.015.02.017.02.34.399.017.02.018.019.36.38.019.018.019.018.38.36.018.019.02.017.398.34.02.017.021.016.415.319.021.015.022.015.431.297.022.015.022.013.447.274.022.014.023.012.46.25.023.012.024.012.472.225.024.011.024.01.484.2.024.01.025.01.493.174.025.009.025.007.502.15.025.006.025.007.51.122.025.006.026.005.514.095.026.005.026.003.52.069.025.003.026.002.522.041.026.002.027.001.523.014h.052l.524-.014h.026l.026-.003.522-.04.026-.003.026-.003.519-.069.026-.003.026-.005.514-.095.026-.005.026-.006.509-.122.025-.007.025-.007.502-.149.025-.007.025-.009.494-.175.024-.008.024-.01.484-.2.024-.01.024-.012.472-.225.024-.012.023-.012.46-.25.023-.012.023-.014.446-.274.022-.013.022-.015.431-.297.022-.015.02-.015.416-.32.02-.015.02-.017.399-.34.02-.017.019-.018.38-.36.018-.019.018-.019.36-.38.019-.018.017-.02.34-.398.017-.02.016-.021.319-.415.015-.021.015-.022.297-.431.015-.022.013-.022.274-.447.014-.022.012-.023.25-.46.012-.023.012-.024.225-.472.011-.024.01-.024.2-.484.01-.024.01-.024.174-.494.009-.025.007-.025.15-.502.006-.025.007-.025.122-.51.006-.025.005-.026.095-.514.005-.026.003-.026.069-.52.003-.025.002-.026.041-.522.002-.026.001-.027.014-.523v-.052l-.014-.524v-.026l-.003-.026-.04-.522-.003-.026-.003-.026-.069-.519-.003-.026-.005-.026-.095-.514-.005-.026-.006-.026-.122-.509-.007-.025-.007-.025-.149-.502-.007-.025-.009-.025-.175-.493-.008-.025-.01-.024-.2-.484-.01-.024-.012-.024-.225-.472-.012-.024-.012-.023-.25-.46-.012-.023-.014-.022-.274-.447-.013-.022-.015-.022-.297-.431-.015-.022-.015-.02-.32-.416-.015-.02-.017-.02-.34-.399-.017-.02-.018-.019-.36-.38-.019-.018-.019-.018-.38-.36-.018-.019-.02-.017-.398-.34-.02-.017-.021-.016-.415-.319-.021-.015-.022-.015-.431-.297-.022-.015-.022-.013-.447-.274L18 2.473l-.023-.012-.46-.25-.023-.012-.024-.012-.472-.225-.024-.011-.024-.01-.484-.2-.024-.01-.024-.01-.494-.174-.025-.009-.025-.007-.502-.15-.025-.007-.025-.006-.51-.122-.025-.006-.026-.005-.514-.095-.026-.005-.026-.003-.52-.069-.025-.003-.026-.002-.522-.041-.026-.002-.027-.001L12.527 1z"
      stroke="#1C510B"
      strokeWidth={2}
    />
    <Path d="M8 11.939L11.04 15 17 9" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
  </Svg>
)

export default React.memo(CheckIcon)
