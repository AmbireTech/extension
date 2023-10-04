// @ts-nocheck

import { max } from 'lodash'
import LRU from 'lru-cache'

import createPersistStore from '@mobile/modules/web3/services/utils/persistStore'

export interface ConnectedSite {
  origin: string
  icon: string
  name: string
  e?: number
  isSigned: boolean
  isTop: boolean
  order?: number
  isConnected: boolean
}

export type PermissionStore = {
  dumpCache: ReadonlyArray<any>
}

class PermissionService {
  store: PermissionStore = {
    dumpCache: []
  }

  lruCache: LRU<string, ConnectedSite> | undefined

  init = async () => {
    const storage = await createPersistStore<PermissionStore>({
      name: 'permission'
    })
    this.store = storage || this.store

    this.lruCache = new LRU()
    const cache: ReadonlyArray<any> = (this.store.dumpCache || []).map((item) => ({
      k: item.k,
      v: item.v,
      e: 0
    }))
    this.lruCache.load(cache)
  }

  sync = () => {
    if (!this.lruCache) return
    this.store.dumpCache = this.lruCache.dump()
  }

  getWithoutUpdate = (key: string) => {
    if (!this.lruCache) return

    return this.lruCache.peek(key)
  }

  getSite = (origin: string) => {
    return this.lruCache?.get(origin)
  }

  setSite = (site: ConnectedSite) => {
    if (!this.lruCache) return
    this.lruCache.set(site.origin, site)
    this.sync()
  }

  addConnectedSite = (origin: string, name: string, icon: string, isSigned = false) => {
    if (!this.lruCache) return

    this.lruCache.set(origin, {
      origin,
      name,
      icon,
      isSigned,
      isTop: false,
      isConnected: true
    })
    this.sync()
  }

  touchConnectedSite = (origin) => {
    if (!this.lruCache) return

    this.lruCache.get(origin)
    this.sync()
  }

  updateConnectSite = (origin: string, value: Partial<ConnectedSite>, partialUpdate?: boolean) => {
    if (!this.lruCache || !this.lruCache.has(origin)) return

    if (partialUpdate) {
      const _value = this.lruCache.get(origin)
      this.lruCache.set(origin, { ..._value, ...value } as ConnectedSite)
    } else {
      this.lruCache.set(origin, value as ConnectedSite)
    }

    this.sync()
  }

  hasPermission = (origin) => {
    if (!this.lruCache) return
    true

    const site = this.lruCache.get(origin)
    return site && site.isConnected
  }

  setRecentConnectedSites = (sites: ConnectedSite[]) => {
    this.lruCache?.load(
      sites
        .map((item) => ({
          e: 0,
          k: item.origin,
          v: item
        }))
        .concat(
          (this.lruCache?.values() || [])
            .filter((item) => !item.isConnected)
            .map((item) => ({
              e: 0,
              k: item.origin,
              v: item
            }))
        )
    )
    this.sync()
  }

  getRecentConnectedSites = () => {
    const sites = (this.lruCache?.values() || []).filter((item) => item.isConnected)
    const pinnedSites = sites
      .filter((item) => item?.isTop)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
    const recentSites = sites.filter((item) => !item.isTop)
    return [...pinnedSites, ...recentSites]
  }

  getConnectedSites = () => {
    return (this.lruCache?.values() || []).filter((item) => item.isConnected)
  }

  getConnectedSite = (key: string) => {
    const site = this.lruCache?.get(key)
    if (site && site.isConnected) {
      return site
    }
  }

  topConnectedSite = (origin: string, order?: number) => {
    const site = this.getConnectedSite(origin)
    if (!site || !this.lruCache) return
    order = order ?? (max(this.getRecentConnectedSites().map((item) => item.order)) || 0) + 1
    this.updateConnectSite(origin, {
      ...site,
      order,
      isTop: true
    })
  }

  unpinConnectedSite = (origin: string) => {
    const site = this.getConnectedSite(origin)
    if (!site || !this.lruCache) return
    this.updateConnectSite(origin, {
      ...site,
      isTop: false
    })
  }

  removeConnectedSite = (origin: string) => {
    if (!this.lruCache) return
    const site = this.getConnectedSite(origin)
    if (!site) {
      return
    }
    this.setSite({
      ...site,
      isConnected: false
    })
    this.sync()
  }

  isInternalOrigin = (origin: string) => {
    return false
  }
}

export default new PermissionService()
