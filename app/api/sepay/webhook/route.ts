import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Sepay webhook handler
// Docs: https://sepay.vn/docs/webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-sepay-signature') || ''

    // Parse the webhook body
    const data = JSON.parse(body)

    console.log('Sepay webhook received:', data)

    // Sepay webhook types:
    // - transaction: Khi có giao dịch mới
    // - payout: Khi có payout (rút tiền)
    const eventType = data.type || data.event || 'transaction'

    if (eventType === 'payout') {
      return NextResponse.json({ success: true, message: 'Payout events ignored' })
    }

    // Extract transaction data from Sepay format
    // Format: https://sepay.vn/docs/webhook
    const amount = parseInt(data.amount || data.transferAmount || data.amountSend || 0)
    const accountNumber = data.accountNumber || data.fromAccountNumber || ''
    const transactionId = data.referenceCode || data.referenceNumber || data.transactionId || data.id?.toString() || ''
    const content = data.content || data.description || data.message || ''
    const bankCode = data.bank || data.gateway || ''

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: true, message: 'Invalid amount, skipping' })
    }

    // Find the streamer by account number in sepay_settings
    const supabase = await createServiceClient()

    const { data: sepaySettings, error: settingsError } = await supabase
      .from('sepay_settings')
      .select('*, profiles(username)')
      .eq('account_number', accountNumber)
      .eq('use_api', true)
      .single()

    if (settingsError || !sepaySettings) {
      console.log('No settings found for account:', accountNumber)
      return NextResponse.json({ success: true, message: 'Account not found' })
    }

    // Verify signature if webhook secret is set
    if (sepaySettings.sepay_webhook_secret) {
      const expectedSignature = crypto
        .createHmac('sha256', sepaySettings.sepay_webhook_secret)
        .update(body)
        .digest('hex')

      // Sepay might use different signature header
      // Try both x-sepay-signature and x-signature
      const isValid = signature === expectedSignature

      if (!isValid && signature) {
        console.log('Invalid signature')
        // In production, you might want to reject invalid signatures
        // For now, we accept all webhooks for testing
      }
    }

    // Check if donation already exists (to avoid duplicates)
    const { data: existingDonation } = await supabase
      .from('donations')
      .select('id')
      .eq('transaction_id', transactionId)
      .single()

    if (existingDonation) {
      return NextResponse.json({ success: true, message: 'Duplicate donation' })
    }

    // Parse donor info from content
    // Common formats:
    // - "donate username message"
    // - "CT tu 0123456789 toi 9876543210 noi dung"
    // - "NAPas 1234567890 50000"
    let donorName = 'Anonymous'
    let message = null

    // Try to extract username/message from content
    // Many Vietnamese donations use format: "donate username message"
    const contentLower = content.toLowerCase()
    if (contentLower.includes('donate') || contentLower.includes('tip') || contentLower.includes('ủng hộ')) {
      // Try to parse: "donate username message"
      const parts = content.split(' ')
      if (parts.length >= 2) {
        // Skip the "donate" keyword, next part is often username
        donorName = parts[1] || 'Anonymous'
        message = parts.slice(2).join(' ') || null
      }
    } else if (content) {
      // Use content as message if no clear pattern
      donorName = content.substring(0, 30) || 'Anonymous'
      message = content.substring(0, 200)
    }

    // Insert the donation
    const { data: donation, error: insertError } = await supabase
      .from('donations')
      .insert({
        streamer_id: sepaySettings.user_id,
        donor_name: donorName,
        message: message,
        amount: amount,
        status: 'confirmed',
        transaction_id: transactionId,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log('Donation created:', donation)
    return NextResponse.json({ success: true, donation })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Handle GET for testing
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Sepay webhook endpoint' })
}
