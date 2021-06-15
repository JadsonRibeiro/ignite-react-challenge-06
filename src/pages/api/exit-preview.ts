import { NextApiRequest, NextApiResponse } from "next"

export default (_: NextApiRequest, res: NextApiResponse) => {
    res.clearPreviewData()

    res.writeHead(307, { Location: '/' })
    res.end()
}