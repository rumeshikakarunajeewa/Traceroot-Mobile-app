import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Order } from '../../lib/api/orders';

interface InvoiceModalProps {
  visible: boolean;
  order: Order;
  onClose: () => void;
}

export default function InvoiceModal({ visible, order, onClose }: InvoiceModalProps) {
  const invoiceNumber = order.invoice_number || `INV-2026-${order.id.replace(/[^0-9]/g, '') || '001'}`;
  const issueDate = new Date(order.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleShare = async () => {
    try {
      await Share.share({
        title: `Invoice ${invoiceNumber}`,
        message: `TraceRoot Organic Food Traceability - Invoice ${invoiceNumber}\nBuyer: ${order.buyer_name}\nCrop: ${order.crop_name} (${order.quantity} ${order.unit})\nTotal Amount: LKR ${order.total_price.toLocaleString()}\nStatus: ${order.status.toUpperCase()}`,
      });
    } catch {
      Alert.alert('Notice', 'Unable to open share sheet.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          {/* Header Bar */}
          <View style={styles.topBar}>
            <View style={styles.invoiceBadge}>
              <MaterialCommunityIcons name="receipt-text-check" size={18} color="#225129" />
              <Text style={styles.invoiceBadgeText}>Official Invoice & Bill</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Feather name="x" size={20} color="#344E39" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Header info */}
            <View style={styles.billHeader}>
              <Text style={styles.brandTitle}>TraceRoot</Text>
              <Text style={styles.brandSubtitle}>Organic Food Traceability Platform</Text>
              <Text style={styles.invoiceNumText}>{invoiceNumber}</Text>
              <Text style={styles.dateText}>Issued on: {issueDate}</Text>
            </View>

            <View style={styles.divider} />

            {/* Billed To / From Row */}
            <View style={styles.entityRow}>
              <View style={styles.entityCol}>
                <Text style={styles.entityLabel}>BILLED TO (BUYER)</Text>
                <Text style={styles.entityName}>{order.buyer_name}</Text>
                <Text style={styles.entitySub}>{order.buyer_verified ? 'Verified Organic Buyer' : 'Buyer'}</Text>
                <Text style={styles.entitySub}>Western Province, LK</Text>
              </View>

              <View style={styles.entityColRight}>
                <Text style={styles.entityLabel}>PRODUCER (FARMER)</Text>
                <Text style={styles.entityName}>Organic Farm Batch</Text>
                <Text style={styles.entitySub}>{order.linked_crop_batch || `${order.crop_name} Field`}</Text>
                <Text style={styles.entitySub}>Verified Producer #TR-442</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Line Items Table */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCol, styles.colDesc]}>Item Description</Text>
                <Text style={[styles.tableCol, styles.colQty]}>Qty</Text>
                <Text style={[styles.tableCol, styles.colRate]}>Rate</Text>
                <Text style={[styles.tableCol, styles.colAmount]}>Amount (LKR)</Text>
              </View>

              <View style={styles.tableRow}>
                <View style={styles.colDesc}>
                  <Text style={styles.itemName}>Certified Organic {order.crop_name}</Text>
                  <Text style={styles.itemBatch}>{order.linked_crop_batch || 'Harvest Lot #1'}</Text>
                </View>
                <Text style={[styles.tableColText, styles.colQty]}>
                  {order.quantity} {order.unit}
                </Text>
                <Text style={[styles.tableColText, styles.colRate]}>
                  {order.unit_price}
                </Text>
                <Text style={[styles.tableColText, styles.colAmount, styles.boldAmount]}>
                  {order.total_price.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Summary Totals */}
            <View style={styles.totalsBox}>
              <View style={styles.totalLine}>
                <Text style={styles.totalLineLabel}>Subtotal</Text>
                <Text style={styles.totalLineValue}>LKR {order.total_price.toLocaleString()}</Text>
              </View>

              <View style={styles.totalLine}>
                <Text style={styles.totalLineLabel}>TraceRoot Traceability Fee</Text>
                <Text style={styles.totalLineFree}>LKR 0 (Free)</Text>
              </View>

              <View style={styles.totalLine}>
                <Text style={styles.totalLineLabel}>Packaging & Quality Check</Text>
                <Text style={styles.totalLineFree}>Included</Text>
              </View>

              <View style={styles.grandTotalDivider} />

              <View style={styles.grandTotalLine}>
                <Text style={styles.grandTotalLabel}>Total Amount Payable</Text>
                <Text style={styles.grandTotalValue}>LKR {order.total_price.toLocaleString()}</Text>
              </View>
            </View>

            {/* Status Stamp */}
            <View style={styles.stampWrapper}>
              <View style={styles.stampBox}>
                <Ionicons name="checkmark-done-circle" size={18} color="#225129" style={{ marginRight: 6 }} />
                <Text style={styles.stampText}>
                  {order.status === 'delivered'
                    ? 'DELIVERED & SETTLED'
                    : 'ORDER CONFIRMED • INVOICE ISSUED'}
                </Text>
              </View>
              <Text style={styles.stampNotice}>
                Payment will be settled directly to your connected bank account upon delivery verification.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
              <Feather name="share-2" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.shareBtnText}>Share Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 38, 22, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4EFE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  invoiceBadgeText: {
    color: '#225129',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F6F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  billHeader: {
    alignItems: 'center',
    marginVertical: 10,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16351E',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#657E6B',
    fontWeight: '500',
    marginTop: 2,
  },
  invoiceNumText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#264E2D',
    marginTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#768B7A',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF2EE',
    marginVertical: 12,
  },
  entityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entityCol: {
    flex: 1,
  },
  entityColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  entityLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A9E8F',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  entityName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16351E',
  },
  entitySub: {
    fontSize: 11,
    color: '#657E6B',
    marginTop: 1,
  },
  table: {
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E6EEE7',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#EAF1EB',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableCol: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B6751',
  },
  colDesc: {
    flex: 2,
  },
  colQty: {
    flex: 1,
    textAlign: 'center',
  },
  colRate: {
    flex: 1,
    textAlign: 'center',
  },
  colAmount: {
    flex: 1.4,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16351E',
  },
  itemBatch: {
    fontSize: 10,
    color: '#768B7A',
    marginTop: 1,
  },
  tableColText: {
    fontSize: 12,
    color: '#344E39',
  },
  boldAmount: {
    fontWeight: '700',
    color: '#16351E',
  },
  totalsBox: {
    backgroundColor: '#FCFDFC',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#EAEFEA',
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLineLabel: {
    fontSize: 12,
    color: '#556E5A',
  },
  totalLineValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16351E',
  },
  totalLineFree: {
    fontSize: 12,
    fontWeight: '600',
    color: '#26682F',
  },
  grandTotalDivider: {
    height: 1,
    backgroundColor: '#DDE5DE',
    marginVertical: 8,
  },
  grandTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16351E',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16351E',
  },
  stampWrapper: {
    marginTop: 14,
    alignItems: 'center',
  },
  stampBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#24522C',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EFF5F0',
  },
  stampText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#24522C',
    letterSpacing: 0.3,
  },
  stampNotice: {
    fontSize: 11,
    color: '#768B7A',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  shareBtn: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: '#225129',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    backgroundColor: '#EFF3F0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#344E39',
    fontSize: 14,
    fontWeight: '700',
  },
});

